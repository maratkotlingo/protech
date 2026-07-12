export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

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

  const prices = await prisma.productPrice.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" }
  });

  return prices;
});
