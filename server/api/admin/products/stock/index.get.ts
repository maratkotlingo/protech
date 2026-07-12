export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const stocks = await prisma.productStock.findMany({
    select: {
      id: true,
      quantity: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          article: true,
          isActive: true
        }
      }
    },
    orderBy: {
      productId: "asc"
    }
  });

  return stocks;
});
