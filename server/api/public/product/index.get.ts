import { Prisma } from "@prisma/client";

interface AttributeFilter {
  attributeId: number;
  value: string;
}

interface ProductQuery {
  page?: string,
  search?: string,
  minPrice?: string,
  maxPrice?: string,
  categoryId?: string,
  sort?: string,
  discountOnly?: string,
  attributes?: string
}

function parseAttributes(attributes?: string): AttributeFilter[] {
  if (!attributes) return [];

  try {
    const parsed = JSON.parse(attributes);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        attributeId: Number(item.attributeId),
        value: String(item.value ?? "").trim()
      }))
      .filter((item) =>
        Number.isInteger(item.attributeId) &&
        item.attributeId > 0 &&
        item.value.length > 0
      );
  } catch {
    throw createError({
      statusCode: 400,
      message: "Некорректный формат attributes"
    });
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery<ProductQuery>(event);

  const currentPage = getPageQueryParam(query.page);

  const search = query.search?.trim();

  const parsedMinPrice = Number(query.minPrice);
  const parsedMaxPrice = Number(query.maxPrice);
  const parsedCategoryId = Number(query.categoryId);

  const minPrice = Number.isFinite(parsedMinPrice) ? parsedMinPrice : undefined;
  const maxPrice = Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : undefined;
  const categoryId = Number.isInteger(parsedCategoryId) && parsedCategoryId > 0 ? parsedCategoryId : undefined;
  const sort = query.sort;
  const discountOnly = query.discountOnly === "1" || query.discountOnly === "true";

  const limit = 20;

  const attributes = parseAttributes(query.attributes);

  const groupedAttributes = new Map<number, Set<string>>();

  for (const attribute of attributes) {
    if (!groupedAttributes.has(attribute.attributeId)) {
      groupedAttributes.set(attribute.attributeId, new Set());
    }

    groupedAttributes.get(attribute.attributeId)!.add(attribute.value);
  }

  const attributeFilters: Prisma.ProductWhereInput[] = Array.from(groupedAttributes.entries()).map(
    ([attributeId, values]) => ({
      productAttributes: {
        some: {
          attributeId,
          value: {
            in: Array.from(values)
          }
        }
      }
    })
  );

  try {
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (sort) {
        case "price_asc":
          return [
            { currentPrice: "asc" },
            { id: "asc" }
          ];

        case "price_desc":
          return [
            { currentPrice: "desc" },
            { id: "asc" }
          ];

        case "newest":
          return [
            { createdAt: "desc" },
            { id: "asc" }
          ];

        case "oldest":
          return [
            { createdAt: "asc" },
            { id: "asc" }
          ];

        default:
          return [
            { id: "asc" }
          ];
      }
    })();

    const where: Prisma.ProductWhereInput = {
      isActive: true,

      ...(search
        ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive"
              }
            },
            {
              description: {
                contains: search,
                mode: "insensitive"
              }
            }
          ]
        }
        : {}),

      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
          currentPrice: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {})
          }
        }
        : {}),

      ...(categoryId !== undefined
        ? {
          categoryId
        }
        : {}),

      ...(discountOnly
        ? {
          oldPrice: {
            not: null
          }
        }
        : {}),

      ...(attributeFilters.length > 0
        ? {
          AND: attributeFilters
        }
        : {})
    };

    const products = await prisma.product.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy,
      where,
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
    });

    const productIds = products.map((product) => product.id);

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

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      currentPrice: product.currentPrice,
      oldPrice: product.oldPrice,
      mainImage: product.mainImage,
      reviewsCount: product._count.reviews,
      averageRating: ratingByProductId.get(product.id) ?? null
    }));
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при получении товаров"
    });
  }
});
