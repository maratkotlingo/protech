import { updateProductStockSchema } from "~~/shared/schemas/admin/products/updateProductStock";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");
  const body = await validateBody(event, updateProductStockSchema);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true }
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: "Товар не найден"
    });
  }

  const stock = await prisma.productStock.upsert({
    where: { productId },
    create: {
      productId,
      quantity: body.quantity
    },
    update: {
      quantity: body.quantity
    }
  });

  return { success: true, stock };
});
