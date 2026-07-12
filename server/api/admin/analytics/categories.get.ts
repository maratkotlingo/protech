import {
  getPaidSalesFilters,
  parseAnalyticsQuery,
  toDateKey,
  toNumber
} from "~~/server/utils/analytics";

type CategoryAnalyticsRow = {
  categoryId: number | null;
  categoryName: string | null;
  products: number | bigint;
  orders: number | bigint;
  quantity: number | bigint;
  revenue: unknown;
  cost: unknown;
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = parseAnalyticsQuery(event);
  const filters = getPaidSalesFilters(query);

  const rows = await prisma.$queryRaw<CategoryAnalyticsRow[]>`
    SELECT
      oi."category_id" AS "categoryId",
      oi."category_name" AS "categoryName",
      COUNT(DISTINCT oi."product_id")::int AS "products",
      COUNT(DISTINCT o."id")::int AS "orders",
      COALESCE(SUM(oi."quantity"), 0)::int AS "quantity",
      COALESCE(SUM(oi."line_total"), 0)::numeric AS "revenue",
      COALESCE(SUM(COALESCE(oi."cost_price", 0) * oi."quantity"), 0)::numeric AS "cost"
    FROM "payment" p
    JOIN "order" o ON o."id" = p."order_id"
    JOIN "order_item" oi ON oi."order_id" = o."id"
    WHERE ${filters}
    GROUP BY 1, 2
    ORDER BY "revenue" DESC
    LIMIT ${query.limit}
  `;

  return {
    period: {
      startDate: toDateKey(query.startDate),
      endDate: toDateKey(query.endDate)
    },
    items: rows.map((row) => {
      const revenue = toNumber(row.revenue);
      const cost = toNumber(row.cost);
      const grossProfit = revenue - cost;

      return {
        categoryId: row.categoryId,
        categoryName: row.categoryName ?? "Без категории",
        products: toNumber(row.products),
        orders: toNumber(row.orders),
        quantity: toNumber(row.quantity),
        revenue,
        cost,
        grossProfit,
        grossMargin: revenue ? grossProfit / revenue : 0
      };
    })
  };
});
