export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const shopQuestionId = getPositiveIntRouterParam(
    event,
    "shopQuestionId",
    "Некорректный ID вопроса"
  );

  const question = await prisma.shopQuestion.findUnique({
    where: { id: shopQuestionId },
    select: { userId: true }
  });

  if (!question) {
    throw createError({
      statusCode: 404,
      message: "Вопрос не найден"
    });
  }

  if (question.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: "Это не ваш вопрос"
    });
  }

  await prisma.shopQuestion.delete({
    where: { id: shopQuestionId }
  }).catch((error) => {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Вопрос не найден"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw error;
  });

  return { success: true };
});
