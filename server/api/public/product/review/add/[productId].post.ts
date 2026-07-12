import { createReviewSchema } from "~~/shared/schemas/user/reviews/createReview"

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

  const result = await readValidatedBody(event, (body) => createReviewSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Ошибка валидации данных',
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    })
  }

  const body = result.data

  try {
    await prisma.review.create({
      data: {
        userId: user.id,
        productId: productId,
        rating: body.rating,
        advantages: body.advantages,
        disadvantages: body.disadvantages,
        comment: body.comment,
        isAnswered: false,

        ...(body.reviewPhotos?.length
          ? {
            reviewPhotos: {
              create: body.reviewPhotos.map((photo) => ({
                url: photo.url,
              })),
            },
          }
          : {}),
      },
      include: {
        reviewPhotos: true,
      }
    })

    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      throw createError({
        statusCode: 409,
        message: "Вы уже оставили отзыв на этот товар"
      })
    }

    if (error.code === "P2003") {
      throw createError({
        statusCode: 404,
        message: "Товар не найден"
      })
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при оставлении отзыва"
    })
  }
});
