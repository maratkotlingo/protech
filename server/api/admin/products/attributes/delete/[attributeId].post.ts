export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const attributeId = getPositiveIntRouterParam(
    event,
    "attributeId",
    "Некорректный ID характеристики"
  );

  try {
    await prisma.attribute.delete({
      where: { id: attributeId }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Характеристика не найдена"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении характеристики"
    });
  }
});
