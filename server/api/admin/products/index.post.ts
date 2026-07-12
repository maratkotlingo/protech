import { createProductSchema } from "~~/shared/schemas/admin/products/createProduct";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const result = await readValidatedBody(event, (body) => createProductSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

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
  } catch (error: any) {
    if (error.code === "P2002") {
      throw createError({
        statusCode: 409,
        message: "Товар с таким артикулом уже существует"
      });
    }

    if (error.code === "P2003") {
      throw createError({
        statusCode: 400,
        message: "Указана несуществующая характеристика"
      });
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при создании товара"
    });
  }
});
