import { PaymentStatus, type Prisma } from "@prisma/client";
import { syncYooKassaPaymentStatus } from "~~/server/utils/yookassaPaymentStatus";

const orderInclude = {
  orderItems: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          mainImage: true
        }
      }
    }
  },
  delivery: true,
  payment: true
} satisfies Prisma.OrderInclude;

async function getUserOrder(orderId: number, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    },
    include: orderInclude
  });
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const orderId = getPositiveIntRouterParam(event, "orderId", "Некорректный ID заказа");

  let order = await getUserOrder(orderId, userId);

  if (!order) {
    throw createError({
      statusCode: 404,
      message: "Заказ не найден"
    });
  }

  if (
    order.paymentMethod === "ONLINE" &&
    order.payment?.paymentStatus === PaymentStatus.PENDING &&
    order.payment.transactionId
  ) {
    try {
      const syncResult = await syncYooKassaPaymentStatus(event, order.payment.transactionId);

      if (syncResult.processed || syncResult.alreadyProcessed) {
        const syncedOrder = await getUserOrder(orderId, userId);

        if (syncedOrder) {
          order = syncedOrder;
        }
      }
    } catch (error) {
      console.error("Failed to sync YooKassa payment status", error);
    }
  }

  return order;
});
