import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus
} from "@prisma/client";
import { prisma } from "./prisma";
import { restoreProductStock } from "./orderStock";

export type ExpireUnpaidOrdersOptions = {
  expiresBefore?: Date;
  now?: Date;
  batchSize?: number;
};

export type ExpireUnpaidOrdersResult = {
  checked: number;
  expired: number;
  orderIds: number[];
};

function getPositiveIntegerEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function getDefaultExpiresBefore(now: Date) {
  const ttlMinutes = getPositiveIntegerEnv("ORDER_PAYMENT_EXPIRY_MINUTES", 30);

  return new Date(now.getTime() - ttlMinutes * 60_000);
}

export async function expireUnpaidOrders(
  options: ExpireUnpaidOrdersOptions = {}
): Promise<ExpireUnpaidOrdersResult> {
  const now = options.now ?? new Date();
  const expiresBefore = options.expiresBefore ?? getDefaultExpiresBefore(now);
  const batchSize = options.batchSize ?? getPositiveIntegerEnv("ORDER_EXPIRY_BATCH_SIZE", 100);

  const candidates = await prisma.order.findMany({
    where: {
      paymentMethod: PaymentMethod.ONLINE,
      orderStatus: { not: OrderStatus.CANCELLED },
      stockReserved: true,
      createdAt: { lte: expiresBefore },
      payment: {
        is: {
          paymentStatus: PaymentStatus.PENDING
        }
      }
    },
    select: {
      id: true
    },
    orderBy: {
      createdAt: "asc"
    },
    take: batchSize
  });

  const expiredOrderIds: number[] = [];

  for (const candidate of candidates) {
    const expired = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: candidate.id },
        include: {
          orderItems: {
            select: {
              productId: true,
              quantity: true
            }
          },
          payment: {
            select: {
              paymentStatus: true
            }
          }
        }
      });

      if (
        !order ||
        order.paymentMethod !== PaymentMethod.ONLINE ||
        order.orderStatus === OrderStatus.CANCELLED ||
        !order.stockReserved ||
        order.createdAt > expiresBefore ||
        order.payment?.paymentStatus !== PaymentStatus.PENDING
      ) {
        return false;
      }

      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentMethod: PaymentMethod.ONLINE,
          orderStatus: { not: OrderStatus.CANCELLED },
          stockReserved: true,
          createdAt: { lte: expiresBefore },
          payment: {
            is: {
              paymentStatus: PaymentStatus.PENDING
            }
          }
        },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          stockReserved: false
        }
      });

      if (claimed.count !== 1) {
        return false;
      }

      await restoreProductStock(tx, order.orderItems, {
        orderId: order.id,
        reason: "Unpaid order expired"
      });

      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          paidAt: null
        }
      });

      return true;
    });

    if (expired) {
      expiredOrderIds.push(candidate.id);
    }
  }

  return {
    checked: candidates.length,
    expired: expiredOrderIds.length,
    orderIds: expiredOrderIds
  };
}
