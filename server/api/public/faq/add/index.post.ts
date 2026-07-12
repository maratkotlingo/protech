import { createShopQuestionSchema } from "~~/shared/schemas/user/faq/createShopQuestion";

export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const body = await validateBody(event, createShopQuestionSchema);

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
