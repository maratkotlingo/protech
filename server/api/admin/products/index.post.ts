import { createProductSchema } from "~~/shared/schemas/admin/products/createProduct";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await validateBody(event, createProductSchema);

  const category = await prisma.category.findUnique({
    where: { id: body.categoryId }
  });

  if (!category) {
    throw createError({
      statusCode: 400,
      message: "Категория не найдена"
    });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        currentPrice: body.currentPrice,
        oldPrice: body.oldPrice,
        article: body.article,
        mainImage: body.mainImage,
        ozonLink: body.ozonLink,
        categoryId: body.categoryId,
        isActive: body.isActive,

        productPrices: {
          create: { value: body.currentPrice }
        },

        productStocks: {
          create: { quantity: 0 }
        },

        ...(body.productImages?.length
          ? {
            productImages: {
              create: body.productImages.map((image) => ({ url: image.url }))
            }
          }
          : {}),

        ...(body.productAttributes?.length
          ? {
            productAttributes: {
              create: body.productAttributes.map((attr) => ({
                attributeId: attr.attributeId,
                value: attr.value
              }))
            }
          }
          : {})
      },
      include: {
        category: true,
        productImages: true,
        productAttributes: {
          include: { attribute: true }
        },
        productStocks: true,
        productPrices: true
      }
    });

    return { success: true, product };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2002: "Товар с таким артикулом уже существует",
      P2003: "Указана несуществующая характеристика"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при создании товара"
    });
  }
});
