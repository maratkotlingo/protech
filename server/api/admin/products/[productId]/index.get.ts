export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  if (!Number.isInteger(productId) || productId <= 0) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID товара",
    });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
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
      productStocks: {
        select: {
          id: true,
          quantity: true,
          updatedAt: true,
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
    },
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: "Товар не найден",
    });
  }

  return product;
});
