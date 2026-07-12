import { createAttributeSchema } from "~~/shared/schemas/admin/products/createAttribute";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const result = await readValidatedBody(event, (body) => createAttributeSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

  try {
    const attribute = await prisma.attribute.create({
      data: body
    });

    return { success: true, attribute };
  } catch (error: any) {
    if (error.code === "P2002") {
      throw createError({
        statusCode: 409,
        message: "Характеристика с таким названием уже существует"
      });
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при создании характеристики"
    });
  }
});
