import { OrderStatus, PaymentStatus } from "@prisma/client";
import { reserveProductStock, restoreProductStock } from "~~/server/utils/orderStock";
import { updatePaymentStatusSchema } from "~~/shared/schemas/admin/orders/updatePaymentStatus";

function getOrderStatusForActivePayment(paymentStatus: PaymentStatus) {
  return paymentStatus === PaymentStatus.PENDING ? OrderStatus.NEW : OrderStatus.CONFIRMED;
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const result = await readValidatedBody(event, (body) => updatePaymentStatusSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

  const paymentStatus = body.paymentStatus as PaymentStatus;

  const updatedPayment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { orderId: body.orderId },
      include: {
        order: {
          select: {
            id: true,
            orderStatus: true,
            stockReserved: true,
            orderItems: {
              select: { productId: true, quantity: true }
            }
          }
        }
      }
    });

    if (!payment) {
      throw createError({
        statusCode: 404,
        message: "Платёж для заказа не найден"
      });
    }

    if (paymentStatus === PaymentStatus.CANCELLED) {
      if (payment.order.orderStatus !== OrderStatus.CANCELLED) {
        if (payment.order.stockReserved) {
          await restoreProductStock(tx, payment.order.orderItems);
        }

        await tx.order.update({
          where: { id: payment.order.id },
          data: {
            orderStatus: OrderStatus.CANCELLED,
            stockReserved: false
          }
        });
      }
    } else if (payment.order.orderStatus === OrderStatus.CANCELLED) {
      if (!payment.order.stockReserved) {
        await reserveProductStock(tx, payment.order.orderItems);
      }

      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          orderStatus: getOrderStatusForActivePayment(paymentStatus),
          stockReserved: true
        }
      });
    } else if (!payment.order.stockReserved) {
      await reserveProductStock(tx, payment.order.orderItems);

      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          stockReserved: true,
          ...(paymentStatus === PaymentStatus.PAID &&
          payment.order.orderStatus === OrderStatus.NEW
            ? { orderStatus: OrderStatus.CONFIRMED }
            : {})
        }
      });
    } else if (
      paymentStatus === PaymentStatus.PAID &&
      payment.order.orderStatus === OrderStatus.NEW
    ) {
      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          orderStatus: OrderStatus.CONFIRMED,
          stockReserved: true
        }
      });
    }

    return await tx.payment.update({
      where: { orderId: body.orderId },
      data: {
        paymentStatus,
        paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
      }
    });
  });

  return { success: true, payment: updatedPayment };
});
