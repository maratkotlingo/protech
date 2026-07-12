export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
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
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    const prismaError = toPrismaHttpError(error, {
      P2025: "Отзыв не найден"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении отзыва"
    });
  }
});
