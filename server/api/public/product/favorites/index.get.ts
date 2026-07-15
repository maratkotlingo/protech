export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);

  try {
    const favorites = await prisma.favoriteProduct.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        createdAt: true,

        product: {
          select: {
            id: true,
            name: true,
            article: true,
            description: true,
            currentPrice: true,
            oldPrice: true,
            mainImage: true,
            category: {
              select: {
                id: true,
                name: true
              }
            },
            productStocks: {
              select: {
                quantity: true
              }
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
                    unit: true
                  }
                }
              }
            },

            _count: {
              select: {
                reviews: true
              }
            }
          }
        }
      }
    });

    const productIds = favorites.map((favorite) => favorite.product.id);

    const ratings = productIds.length
      ? await prisma.review.groupBy({
        by: ["productId"],
        where: {
          productId: {
            in: productIds
          }
        },
        _avg: {
          rating: true
        }
      })
      : [];

    const ratingByProductId = new Map(
      ratings.map((item) => [
        item.productId,
        item._avg.rating === null ? null : Number(item._avg.rating.toFixed(1))
      ])
    );

    return favorites.map((favorite) => ({
      id: favorite.id,
      createdAt: favorite.createdAt,
      product: {
        id: favorite.product.id,
        name: favorite.product.name,
        article: favorite.product.article,
        description: favorite.product.description,
        currentPrice: favorite.product.currentPrice,
        oldPrice: favorite.product.oldPrice,
        mainImage: favorite.product.mainImage,
        category: favorite.product.category,
        stockQuantity: favorite.product.productStocks[0]?.quantity ?? 0,
        reviewsCount: favorite.product._count.reviews,
        averageRating: ratingByProductId.get(favorite.product.id) ?? null,
        productAttributes: favorite.product.productAttributes
      }
    }));
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении избранных товаров"
    });
  }
});
