export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    await prisma.product.delete({
      where: { id: productId }
    });

    return { success: true };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Товар не найден",
      P2003: {
        statusCode: 409,
        message: "Невозможно удалить товар, связанный с заказами"
      }
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении товара"
    });
  }
});
