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
  const reviewId = getPositiveIntRouterParam(event, "reviewId", "Некорректный ID отзыва");

  try {
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId
      }
    });

    if (!review) {
      throw createError({
        statusCode: 404,
        message: "Отзыв не найден"
      });
    }

    if (review.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: "Это не ваш отзыв"
      });
    }

    await prisma.review.delete({
      where: {
        id: reviewId
      }
    });

    return { success: true };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении отзыва"
    });
  }
});
