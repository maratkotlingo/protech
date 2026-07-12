import { categorySchema } from "~~/shared/schemas/admin/products/category";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const categoryId = getPositiveIntRouterParam(event, "categoryId", "Некорректный ID категории");
  const body = await validateBody(event, categorySchema);

  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name: body.name }
    });

    return { success: true, category };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Категория не найдена",
      P2002: "Категория с таким названием уже существует"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении категории"
    });
  }
});
