import { AuditAction } from "@prisma/client";
import { recordStockAdjustment } from "~~/server/utils/orderStock";
import { bulkStockArrivalSchema } from "~~/shared/schemas/admin/products/bulkStockArrival";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);
  const body = await validateBody(event, bulkStockArrivalSchema);

  const existingProducts = await prisma.product.findMany({
    where: { id: { in: body.productIds } },
    select: { id: true }
  });
  const existingIds = new Set(existingProducts.map((product) => product.id));
  const missingIds = body.productIds.filter((productId) => !existingIds.has(productId));

  if (missingIds.length) {
    throw createError({
      statusCode: 400,
      message: `Товары не найдены: ${missingIds.join(", ")}`
    });
  }

  const reason = body.reason || "Bulk stock arrival";
  const stocks = await prisma.$transaction(async (tx) => {
    const updated = [];

    for (const productId of body.productIds) {
      const stock = await tx.productStock.upsert({
        where: { productId },
        create: {
          productId,
          quantity: body.quantityDelta
        },
        update: {
          quantity: { increment: body.quantityDelta }
        }
      });

      await recordStockAdjustment(tx, {
        productId,
        quantityDelta: body.quantityDelta,
        quantityAfter: stock.quantity,
        reason
      });

      updated.push(stock);
    }

    return updated;
  });

  await recordAdminAudit({
    adminId: userId,
    action: AuditAction.STOCK_ADJUSTMENT,
    entityType: "product_stock",
    summary: "Bulk stock arrival",
    metadata: {
      productIds: body.productIds,
      quantityDelta: body.quantityDelta,
      reason,
      affected: stocks.length
    }
  });

  return { success: true, count: stocks.length, stocks };
});
