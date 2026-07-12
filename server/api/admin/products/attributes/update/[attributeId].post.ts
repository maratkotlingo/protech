import { updateAttributeSchema } from "~~/shared/schemas/admin/products/updateAttribute";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const attributeId = getPositiveIntRouterParam(
    event,
    "attributeId",
    "Некорректный ID характеристики"
  );
  const body = await validateBody(event, updateAttributeSchema);

  try {
    const attribute = await prisma.attribute.update({
      where: { id: attributeId },
      data: body
    });

    return { success: true, attribute };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Характеристика не найдена",
      P2002: "Характеристика с таким названием уже существует"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении характеристики"
    });
  }
});
