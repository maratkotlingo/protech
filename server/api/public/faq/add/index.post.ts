import { createShopQuestionSchema } from "~~/shared/schemas/user/faq/createShopQuestion";

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

  const result = await readValidatedBody(event, (body) => createShopQuestionSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

  const question = await prisma.shopQuestion.create({
    data: {
      userId: user.id,
      title: body.title,
      comment: body.comment,
      isAnswered: false,

      ...(body.shopQuestionImages?.length
        ? {
          shopQuestionImages: {
            create: body.shopQuestionImages.map((image) => ({ url: image.url }))
          }
        }
        : {})
    },
    include: {
      shopQuestionImages: true
    }
  });

  return { success: true, question };
});
