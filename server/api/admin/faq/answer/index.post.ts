import { shopAnswerSchema } from "~~/shared/schemas/admin/faq/shopAnswer";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const result = await readValidatedBody(event, (body) => shopAnswerSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

  const question = await prisma.shopQuestion.findUnique({
    where: { id: body.shopQuestionId }
  });

  if (!question) {
    throw createError({
      statusCode: 404,
      message: "Вопрос не найден"
    });
  }

  const [answer] = await prisma.$transaction([
    prisma.shopAnswer.create({
      data: {
        shopQuestionId: body.shopQuestionId,
        comment: body.comment,
        userId
      }
    }),
    prisma.shopQuestion.update({
      where: { id: body.shopQuestionId },
      data: { isAnswered: true }
    })
  ]);

  return { success: true, answer };
});
