export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const productIds = await parseProductIdsBody(event);

  try {
    const result = await prisma.productSubscription.deleteMany({
      where: {
        userId,
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
      message: "Ошибка сервера при удалении подписок на товары"
    });
  }
});
