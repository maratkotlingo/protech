import { Prisma } from "@prisma/client";
import { updateShopQuestionSchema } from "~~/shared/schemas/user/faq/updateShopQuestion";

export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const shopQuestionId = getPositiveIntRouterParam(
    event,
    "shopQuestionId",
    "Некорректный ID вопроса"
  );
  const body = await validateBody(event, updateShopQuestionSchema);

  const existing = await prisma.shopQuestion.findUnique({
    where: { id: shopQuestionId },
    select: { userId: true }
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: "Вопрос не найден"
    });
  }

  if (existing.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: "Это не ваш вопрос"
    });
  }

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

  const question = await prisma.shopQuestion.update({
    where: { id: shopQuestionId },
    data,
    include: {
      shopQuestionImages: true
    }
  }).catch((error) => {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Вопрос не найден"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw error;
  });

  return { success: true, question };
});
