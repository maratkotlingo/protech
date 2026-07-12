export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы неавторизованы"
    });
  }

  const user = session.user;
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    const result = await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: user.id
        },
        productId
      }
    });

    return { success: true, deletedCount: result.count };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении товара из корзины"
    });
  }
});
