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
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    await prisma.productSubscription.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId
        }
      },
      create: {
        userId: user.id,
        productId: productId
      },
      update: {}
    })

    return { success: true };
  } catch (error: any) {
    if (error.code === "P2003") {
      throw createError({
        statusCode: 404,
        message: "Товар не найден"
      })
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при добавлении товара в подписку"
    })
  }
});
