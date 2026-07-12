import { shopAnswerSchema } from "~~/shared/schemas/admin/faq/shopAnswer";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);
  const body = await validateBody(event, shopAnswerSchema);

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
  ]).catch((error) => {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Вопрос не найден",
      P2003: { statusCode: 404, message: "Вопрос не найден" }
    });

    if (prismaError) {
      throw prismaError;
    }

    throw error;
  });

  return { success: true, answer };
});
