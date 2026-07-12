export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы неавторизованы"
    })
  }

  const user = session.user;

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
            currentPrice: true,
            oldPrice: true,
            mainImage: true,

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

    const ratings = await prisma.review.groupBy({
      by: ["productId"],
      where: {
        productId: {
          in: productIds
        }
      },
      _avg: {
        rating: true
      }
    });

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
        currentPrice: favorite.product.currentPrice,
        oldPrice: favorite.product.oldPrice,
        mainImage: favorite.product.mainImage,
        reviewsCount: favorite.product._count.reviews,
        averageRating: ratingByProductId.get(favorite.product.id) ?? null
      }
    }));
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении избранных товаров"
    })
  }
});
