import {
  OrderStatus,
  PaymentStatus,
  Prisma
} from "@prisma/client";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { reserveOrderStock, restoreOrderStock } from "~~/server/utils/orderStock";
import { getYooKassaPayment } from "~~/server/utils/yookassa";

const yookassaWebhookSchema = z
  .object({
    type: z.literal("notification"),
    event: z.enum([
      "payment.succeeded",
      "payment.canceled",
      "payment.waiting_for_capture"
    ]),
    object: z
      .object({
        id: z.string().min(1),
        status: z.enum([
          "pending",
          "waiting_for_capture",
          "succeeded",
          "canceled"
        ]),
        paid: z.boolean().optional(),
        metadata: z.record(z.string(), z.string()).optional()
      })
      .passthrough()
  })
  .passthrough();

function ignored(reason: string) {
  return {
    ok: true,
    ignored: true,
    reason
  };
}

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, (body) => yookassaWebhookSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid webhook payload",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

  const payment = await getYooKassaPayment(event, body.object.id);

  const orderIdFromMetadata = Number(payment.metadata?.orderId);

  const existingPayment = await prisma.payment.findFirst({
    where: {
      OR: [
        { transactionId: payment.id },
        ...(Number.isInteger(orderIdFromMetadata)
          ? [{ orderId: orderIdFromMetadata }]
          : [])
      ]
    },
    include: {
      order: {
        select: {
          orderStatus: true,
          paymentMethod: true,
          stockReserved: true
        }
      }
    }
  });

  if (!existingPayment) {
    return ignored("Payment not found");
  }

  if (existingPayment.order.paymentMethod !== "ONLINE") {
    return ignored("Order is not an online payment order");
  }

  if (existingPayment.transactionId && existingPayment.transactionId !== payment.id) {
    return ignored("Payment transaction mismatch");
  }

  if (Number.isInteger(orderIdFromMetadata) && orderIdFromMetadata !== existingPayment.orderId) {
    return ignored("Payment order metadata mismatch");
  }

  if (payment.amount.currency !== "RUB") {
    return ignored("Payment currency mismatch");
  }

  const actualAmount = new Prisma.Decimal(payment.amount.value);
  const expectedAmount = new Prisma.Decimal(existingPayment.amount);

  if (!expectedAmount.equals(actualAmount)) {
    return ignored("Payment amount mismatch");
  }

  if (payment.status === "succeeded" && payment.paid) {
    if (existingPayment.paymentStatus === PaymentStatus.PAID) {
      return { ok: true, alreadyProcessed: true };
    }

    let processed = false;

    await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.updateMany({
        where: {
          id: existingPayment.id,
          paymentStatus: PaymentStatus.PENDING,
          order: {
            is: {
              orderStatus: { not: OrderStatus.CANCELLED }
            }
          }
        },
        data: {
          transactionId: payment.id,
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
          amount: actualAmount
        }
      });

      if (updatedPayment.count !== 1) {
        return;
      }

      const order = await tx.order.findUnique({
        where: { id: existingPayment.orderId },
        select: {
          orderStatus: true,
          stockReserved: true
        }
      });

      if (!order || order.orderStatus === OrderStatus.CANCELLED) {
        throw createError({
          statusCode: 409,
          statusMessage: "Order is not available for payment confirmation"
        });
      }

      if (!order.stockReserved) {
        await reserveOrderStock(tx, existingPayment.orderId);
      }

      await tx.order.update({
        where: { id: existingPayment.orderId },
        data: {
          orderStatus: OrderStatus.CONFIRMED,
          stockReserved: true
        }
      });

      processed = true;
    });

    if (!processed) {
      return ignored("Payment is not pending or order is cancelled");
    }

    return { ok: true };
  }

  if (payment.status === "canceled") {
    if (existingPayment.paymentStatus === PaymentStatus.CANCELLED) {
      return { ok: true, alreadyProcessed: true };
    }

    let processed = false;

    await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.updateMany({
        where: {
          id: existingPayment.id,
          paymentStatus: PaymentStatus.PENDING
        },
        data: {
          transactionId: payment.id,
          paymentStatus: PaymentStatus.CANCELLED,
          paidAt: null
        }
      });

      if (updatedPayment.count !== 1) {
        return;
      }

      const order = await tx.order.findUnique({
        where: { id: existingPayment.orderId },
        select: {
          orderStatus: true,
          stockReserved: true
        }
      });

      if (order?.orderStatus !== OrderStatus.CANCELLED && order?.stockReserved) {
        await restoreOrderStock(tx, existingPayment.orderId);
      }

      await tx.order.update({
        where: { id: existingPayment.orderId },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          stockReserved: false
        }
      });

      processed = true;
    });

    if (!processed) {
      return ignored("Payment is not pending");
    }

    return { ok: true };
  }

  return {
    ok: true,
    status: payment.status
  };
});
