import { Prisma } from "@prisma/client";
import {
  parseAnalyticsQuery,
  toDateKey,
  toNumber
} from "~~/server/utils/analytics";

type MovementRow = {
  periodStart: Date;
  type: string;
  quantityDelta: number | bigint;
  movements: number | bigint;
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = parseAnalyticsQuery(event);
  const movementFilters: Prisma.Sql[] = [
    Prisma.sql`sm."created_at" >= ${query.startDate}`,
    Prisma.sql`sm."created_at" <= ${query.endDate}`
  ];

  if (query.productId) {
    movementFilters.push(Prisma.sql`sm."product_id" = ${query.productId}`);
  }

  if (query.categoryId) {
    movementFilters.push(Prisma.sql`p."category_id" = ${query.categoryId}`);
  }

  const where = Prisma.join(movementFilters, " AND ");

  const [movementRows, lowStockItems] = await Promise.all([
    prisma.$queryRaw<MovementRow[]>`
      SELECT
        date_trunc(${query.granularity}, sm."created_at") AS "periodStart",
        sm."type"::text AS "type",
        COALESCE(SUM(sm."quantity_delta"), 0)::int AS "quantityDelta",
        COUNT(sm."id")::int AS "movements"
      FROM "stock_movement" sm
      JOIN "product" p ON p."id" = sm."product_id"
      WHERE ${where}
      GROUP BY 1, 2
      ORDER BY 1 ASC, 2 ASC
    `,
    prisma.productStock.findMany({
      where: {
        quantity: {
          lte: 5
        },
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.categoryId
          ? {
            product: {
              categoryId: query.categoryId
            }
          }
          : {})
      },
      select: {
        quantity: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            article: true,
            mainImage: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        quantity: "asc"
      },
      take: query.limit
    })
  ]);

  return {
    period: {
      startDate: toDateKey(query.startDate),
      endDate: toDateKey(query.endDate),
      granularity: query.granularity
    },
    movementsByPeriod: movementRows.map((row) => ({
      date: toDateKey(row.periodStart),
      type: row.type,
      quantityDelta: toNumber(row.quantityDelta),
      movements: toNumber(row.movements)
    })),
    lowStockItems: lowStockItems.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      article: item.product.article,
      mainImage: item.product.mainImage,
      category: item.product.category,
      quantity: item.quantity,
      updatedAt: item.updatedAt
    }))
  };
});
