import { AuditAction } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const shopQuestionId = getPositiveIntRouterParam(event, "shopQuestionId", "Некорректный ID вопроса");

  try {
    const question = await prisma.shopQuestion.findUnique({
      where: { id: shopQuestionId },
      select: { id: true, title: true, userId: true }
    });

    await prisma.shopQuestion.delete({
      where: { id: shopQuestionId }
    });

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.DELETE,
      entityType: "shop_question",
      entityId: shopQuestionId,
      summary: `Deleted FAQ question ${question?.title ?? shopQuestionId}`,
      metadata: {
        userId: question?.userId
      }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Вопрос не найден"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении вопроса"
    });
  }
});
