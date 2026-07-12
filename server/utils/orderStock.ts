import { Prisma } from "@prisma/client";
import { createError } from "h3";

type StockItem = {
  productId: number;
  quantity: number;
};

type OrderStockTransaction = Prisma.TransactionClient;

function normalizeStockItems(items: StockItem[]) {
  const quantityByProductId = new Map<number, number>();

  for (const item of items) {
    if (!Number.isInteger(item.productId) || item.productId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid product id"
      });
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid product quantity"
      });
    }

    quantityByProductId.set(
      item.productId,
      (quantityByProductId.get(item.productId) ?? 0) + item.quantity
    );
  }

  return [...quantityByProductId.entries()].map(([productId, quantity]) => ({
    productId,
    quantity
  }));
}

export async function reserveProductStock(
  tx: OrderStockTransaction,
  items: StockItem[]
) {
  for (const item of normalizeStockItems(items)) {
    const result = await tx.productStock.updateMany({
      where: {
        productId: item.productId,
        quantity: { gte: item.quantity }
      },
      data: {
        quantity: { decrement: item.quantity }
      }
    });

    if (result.count !== 1) {
      throw createError({
        statusCode: 409,
        statusMessage: `Not enough stock for product ${item.productId}`
      });
    }
  }
}

export async function restoreProductStock(
  tx: OrderStockTransaction,
  items: StockItem[]
) {
  for (const item of normalizeStockItems(items)) {
    await tx.productStock.upsert({
      where: { productId: item.productId },
      create: {
        productId: item.productId,
        quantity: item.quantity
      },
      update: {
        quantity: { increment: item.quantity }
      }
    });
  }
}

export async function getOrderStockItems(
  tx: OrderStockTransaction,
  orderId: number
) {
  return await tx.orderItem.findMany({
    where: { orderId },
    select: { productId: true, quantity: true }
  });
}

export async function reserveOrderStock(
  tx: OrderStockTransaction,
  orderId: number
) {
  const orderItems = await getOrderStockItems(tx, orderId);
  await reserveProductStock(tx, orderItems);
}

export async function restoreOrderStock(
  tx: OrderStockTransaction,
  orderId: number
) {
  const orderItems = await getOrderStockItems(tx, orderId);
  await restoreProductStock(tx, orderItems);
}
