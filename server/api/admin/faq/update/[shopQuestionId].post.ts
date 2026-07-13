import { AuditAction, type Prisma } from "@prisma/client";
import { updateShopQuestionSchema } from "~~/shared/schemas/user/faq/updateShopQuestion";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const shopQuestionId = getPositiveIntRouterParam(event, "shopQuestionId", "Некорректный ID вопроса");
  const body = await validateBody(event, updateShopQuestionSchema);
  const data: Prisma.ShopQuestionUpdateInput = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.comment !== undefined) data.comment = body.comment;

  data.isAnswered = false;

  if (body.shopQuestionImages !== undefined) {
    data.shopQuestionImages = {
      deleteMany: {},
      create: body.shopQuestionImages.map((image) => ({ url: image.url }))
    };
  }

  try {
    const question = await prisma.shopQuestion.update({
      where: { id: shopQuestionId },
      data,
      include: {
        shopQuestionImages: true
      }
    });

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.UPDATE,
      entityType: "shop_question",
      entityId: question.id,
      summary: `Updated FAQ question ${question.id}`,
      metadata: {
        fields: Object.keys(body)
      }
    });

    return { success: true, question };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Вопрос не найден"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении вопроса"
    });
  }
});
