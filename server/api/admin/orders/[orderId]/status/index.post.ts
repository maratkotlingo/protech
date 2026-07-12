import { OrderStatus, PaymentStatus } from "@prisma/client";
import { reserveProductStock, restoreProductStock } from "~~/server/utils/orderStock";
import { updateOrderStatusSchema } from "~~/shared/schemas/admin/orders/updateOrderStatus";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const orderId = getPositiveIntRouterParam(event, "orderId", "Некорректный ID заказа");

  const result = await readValidatedBody(event, (body) => updateOrderStatusSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          payment: {
            select: { paymentStatus: true }
          },
          orderItems: {
            select: { productId: true, quantity: true }
          }
        }
      });

      if (!existingOrder) {
        throw createError({
          statusCode: 404,
          message: "Заказ не найден"
        });
      }

      const nextOrderStatus = body.orderStatus as OrderStatus;
      const orderData: { orderStatus: OrderStatus; stockReserved?: boolean } = {
        orderStatus: nextOrderStatus
      };

      if (
        existingOrder.orderStatus !== OrderStatus.CANCELLED &&
        nextOrderStatus === OrderStatus.CANCELLED
      ) {
        if (existingOrder.stockReserved) {
          await restoreProductStock(tx, existingOrder.orderItems);
        }

        orderData.stockReserved = false;

        await tx.payment.updateMany({
          where: {
            orderId,
            paymentStatus: { not: PaymentStatus.PAID }
          },
          data: {
            paymentStatus: PaymentStatus.CANCELLED,
            paidAt: null
          }
        });
      }

      if (nextOrderStatus !== OrderStatus.CANCELLED && !existingOrder.stockReserved) {
        await reserveProductStock(tx, existingOrder.orderItems);
        orderData.stockReserved = true;
      }

      if (
        existingOrder.orderStatus === OrderStatus.CANCELLED &&
        nextOrderStatus !== OrderStatus.CANCELLED
      ) {
        if (existingOrder.payment?.paymentStatus === PaymentStatus.CANCELLED) {
          await tx.payment.update({
            where: { orderId },
            data: {
              paymentStatus:
                existingOrder.paymentMethod === "ONLINE"
                  ? PaymentStatus.PENDING
                  : PaymentStatus.UPON_RECEIPT,
              paidAt: null
            }
          });
        }
      }

      return await tx.order.update({
        where: { id: orderId },
        data: orderData,
        include: {
          orderItems: true,
          delivery: true,
          payment: true
        }
      });
    });

    return { success: true, order };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    if (error.code === "P2025") {
      throw createError({
        statusCode: 404,
        message: "Заказ не найден"
      });
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении статуса заказа"
    });
  }
});
