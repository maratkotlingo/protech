import { Prisma } from "@prisma/client";
import { updateReviewSchema } from "~~/shared/schemas/user/reviews/updateReview";

export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const body = await validateBody(event, updateReviewSchema);
  const reviewId = getPositiveIntRouterParam(event, "reviewId", "Некорректный ID отзыва");

  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true }
  });

  if (!existingReview) {
    throw createError({
      statusCode: 404,
      message: "Отзыв не найден"
    });
  }

  if (existingReview.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: "Это не ваш отзыв"
    });
  }

  const data: Prisma.ReviewUpdateInput = {};

  if (body.rating !== undefined) {
    data.rating = body.rating;
  }

  if (body.advantages !== undefined) {
    data.advantages = body.advantages;
  }

  if (body.disadvantages !== undefined) {
    data.disadvantages = body.disadvantages;
  }

  if (body.comment !== undefined) {
    data.comment = body.comment;
  }

  data.isAnswered = false;

  if (body.reviewPhotos !== undefined) {
    data.reviewPhotos = {
      deleteMany: {},

      ...(body.reviewPhotos.length > 0
        ? {
          create: body.reviewPhotos.map((photo) => ({
            url: photo.url
          }))
        }
        : {})
    };
  }

  try {
    await prisma.review.update({
      where: {
        id: reviewId
      },
      data,
      include: {
        reviewPhotos: true,
        reviewAnswers: true
      }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Отзыв не найден"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении отзыва"
    });
  }
});
