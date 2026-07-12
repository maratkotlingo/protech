export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы неавторизованы"
    })
  }

  const user = session.user;

  try {
    const subscriptions = await prisma.productSubscription.findMany({
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

    return subscriptions;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении подписок на товары"
    })
  }
});
