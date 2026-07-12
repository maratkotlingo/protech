import { Prisma } from "@prisma/client";
import { updateShopQuestionSchema } from "~~/shared/schemas/user/faq/updateShopQuestion";

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

  const result = await readValidatedBody(event, (body) => updateShopQuestionSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

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
  });

  return { success: true, question };
});
