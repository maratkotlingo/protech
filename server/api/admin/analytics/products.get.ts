import { Prisma } from "@prisma/client";
import {
  getPaidSalesFilters,
  parseAnalyticsQuery,
  toDateKey,
  toNumber
} from "~~/server/utils/analytics";

type ProductAnalyticsRow = {
  productId: number;
  name: string;
  article: string;
  mainImage: string | null;
  categoryId: number | null;
  categoryName: string | null;
  orders: number | bigint;
  quantity: number | bigint;
  revenue: unknown;
  cost: unknown;
  currentStock: number | null;
};

const sortSqlByKey = {
  revenue: Prisma.sql`"revenue" DESC`,
  quantity: Prisma.sql`"quantity" DESC`,
  orders: Prisma.sql`"orders" DESC`,
  profit: Prisma.sql`("revenue" - "cost") DESC`
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = parseAnalyticsQuery(event);
  const filters = getPaidSalesFilters(query);
  const orderBy = sortSqlByKey[query.sortBy];

  const rows = await prisma.$queryRaw<ProductAnalyticsRow[]>`
    WITH product_sales AS (
      SELECT
        oi."product_id" AS "productId",
        oi."product_name" AS "name",
        oi."product_article" AS "article",
        oi."product_main_image" AS "mainImage",
        oi."category_id" AS "categoryId",
        oi."category_name" AS "categoryName",
        COUNT(DISTINCT o."id")::int AS "orders",
        COALESCE(SUM(oi."quantity"), 0)::int AS "quantity",
        COALESCE(SUM(oi."line_total"), 0)::numeric AS "revenue",
        COALESCE(SUM(COALESCE(oi."cost_price", 0) * oi."quantity"), 0)::numeric AS "cost"
      FROM "payment" p
      JOIN "order" o ON o."id" = p."order_id"
      JOIN "order_item" oi ON oi."order_id" = o."id"
      WHERE ${filters}
      GROUP BY 1, 2, 3, 4, 5, 6
    )
    SELECT
      ps.*,
      stock."quantity" AS "currentStock"
    FROM product_sales ps
    LEFT JOIN "product_stock" stock ON stock."product_id" = ps."productId"
    ORDER BY ${orderBy}
    LIMIT ${query.limit}
  `;

  return {
    period: {
      startDate: toDateKey(query.startDate),
      endDate: toDateKey(query.endDate)
    },
    sortBy: query.sortBy,
    items: rows.map((row) => {
      const revenue = toNumber(row.revenue);
      const cost = toNumber(row.cost);
      const orders = toNumber(row.orders);
      const quantity = toNumber(row.quantity);
      const grossProfit = revenue - cost;

      return {
        productId: row.productId,
        name: row.name,
        article: row.article,
        mainImage: row.mainImage,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        orders,
        quantity,
        revenue,
        cost,
        grossProfit,
        grossMargin: revenue ? grossProfit / revenue : 0,
        averageUnitPrice: quantity ? revenue / quantity : 0,
        averageOrderValue: orders ? revenue / orders : 0,
        currentStock: row.currentStock ?? 0
      };
    })
  };
});
