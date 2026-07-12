export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);

  try {
    return await prisma.productSubscription.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        createdAt: true,

        product: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
            mainImage: true,
            productStocks: {
              select: {
                quantity: true,
                updatedAt: true
              }
            }
          }
        }
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении подписок на товары"
    });
  }
});
