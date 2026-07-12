import { reviewAnswerSchema } from "~~/shared/schemas/admin/reviews/reviewAnswer";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const reviewId = getPositiveIntRouterParam(event, "reviewId", "Некорректный ID отзыва");

  const result = await readValidatedBody(event, (body) => reviewAnswerSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw createError({
      statusCode: 404,
      message: "Отзыв не найден"
    });
  }

  const [answer] = await prisma.$transaction([
    prisma.reviewAnswer.create({
      data: {
        reviewId,
        text: body.text,
        userId
      }
    }),
    prisma.review.update({
      where: { id: reviewId },
      data: { isAnswered: true }
    })
  ]);

  return { success: true, answer };
});
