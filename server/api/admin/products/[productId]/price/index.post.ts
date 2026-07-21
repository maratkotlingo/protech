import { AuditAction, Prisma } from "@prisma/client";
import { addProductPriceSchema } from "~~/shared/schemas/admin/products/addProductPrice";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");
  const body = await validateBody(event, addProductPriceSchema);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, currentPrice: true }
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: "Товар не найден"
    });
  }

  const { priceRecord, updatedProduct } = await prisma.$transaction(async (tx) => {
    const priceRecord = await tx.productPrice.create({
      data: {
        productId,
        value: body.value
      }
    });

    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        oldPrice: product.currentPrice,
        currentPrice: new Prisma.Decimal(body.value)
      }
    });

    return { priceRecord, updatedProduct };
  });

  await recordAdminAudit({
    adminId: userId,
    action: AuditAction.UPDATE,
    entityType: "product_price",
    entityId: priceRecord.id,
    summary: `Updated product ${productId} price`,
    metadata: {
      productId,
      oldPrice: product.currentPrice.toString(),
      currentPrice: priceRecord.value.toString()
    }
  });

  return {
    success: true,
    price: priceRecord,
    product: updatedProduct
  };
});
