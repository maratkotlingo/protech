export default defineEventHandler(async (event) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true
      }
    });

    return categories;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении категорий"
    })
  }
});
