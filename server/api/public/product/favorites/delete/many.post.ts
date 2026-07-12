export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const productIds = await parseProductIdsBody(event);

  try {
    const result = await prisma.favoriteProduct.deleteMany({
      where: {
        userId: user.id,
        productId: {
          in: productIds
        }
      }
    });

    return {
      success: true,
      deletedCount: result.count
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении товаров из избранного"
    });
  }
});
