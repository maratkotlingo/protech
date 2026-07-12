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
  } catch (error: any) {
    if (error.code === "P2025") {
      throw createError({
        statusCode: 404,
        message: "Характеристика не найдена"
      });
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении характеристики"
    });
  }
});
