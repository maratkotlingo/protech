export default defineEventHandler(async (event) => {
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        currentPrice: true,
        oldPrice: true,
        article: true,
        mainImage: true,
        ozonLink: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        category: {
          select: {
            id: true,
            name: true,
          },
        },

        productImages: {
          select: {
            id: true,
            url: true,
          },
        },

        productAttributes: {
          select: {
            id: true,
            value: true,
            attributeId: true,
            attribute: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },

        productPrices: {
          select: {
            id: true,
            value: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        productStocks: {
          select: {
            id: true,
            quantity: true,
            updatedAt: true,
          },
        },

        reviews: {
          select: {
            id: true,
            rating: true,
            advantages: true,
            disadvantages: true,
            comment: true,
            createdAt: true,
            updatedAt: true,

            reviewPhotos: {
              select: {
                id: true,
                url: true
              }
            },

            reviewAnswers: {
              select: {
                id: true,
                text: true,
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!product || !product.isActive) {
      throw createError({
        statusCode: 404,
        message: "Товар не найден",
      });
    }

    return product;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении деталей товара",
    });
  }
});
