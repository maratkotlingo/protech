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
  });

  return { success: true };
});
