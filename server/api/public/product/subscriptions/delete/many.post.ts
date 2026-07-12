interface IFavoriteProducts {
  productIds: number[]
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  })

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы неавторизованы"
    })
  }

  const userId = session.user.id
  const data = await readBody<IFavoriteProducts>(event)

  const productIds = Array.isArray(data?.productIds)
    ? [...new Set(data.productIds)]
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
    : []

  if (!productIds.length) {
    throw createError({
      statusCode: 400,
      message: "Передайте массив productIds"
    })
  }

  try {
    const result = await prisma.productSubscription.deleteMany({
      where: {
        userId,
        productId: {
          in: productIds
        }
      }
    })

    return {
      success: true,
      deletedCount: result.count
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при удалении подписок на товары"
    })
  }
});
