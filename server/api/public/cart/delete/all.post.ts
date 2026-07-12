export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);

  try {
    const result = await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: user.id
        }
      }
    });

    return { success: true, deletedCount: result.count };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении всех товаров из корзины"
    });
  }
});
