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
    const result = await prisma.favoriteProduct.deleteMany({
      where: {
        userId: user.id
      }
    });

    return { success: true, deletedCount: result.count };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении всех избранных товаров"
    })
  }
});
