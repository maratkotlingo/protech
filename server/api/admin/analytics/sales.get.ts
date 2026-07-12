import {
  getCategoryOptions,
  getPaidSalesFilters,
  getProductOptions,
  parseAnalyticsQuery,
  toDateKey,
  toNumber
} from "~~/server/utils/analytics";

type SalesRow = {
  periodStart: Date;
  orders: number | bigint;
  quantity: number | bigint;
  revenue: unknown;
  cost: unknown;
};

type BreakdownRow = {
  key: string;
  orders: number | bigint;
  revenue?: unknown;
};

function addPeriod(date: Date, granularity: string) {
  const next = new Date(date);

  if (granularity === "month") {
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  if (granularity === "week") {
    next.setDate(next.getDate() + 7);
    return next;
  }

  next.setDate(next.getDate() + 1);
  return next;
}

function startOfPeriod(date: Date, granularity: string) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);

  if (granularity === "month") {
    next.setDate(1);
  }

  if (granularity === "week") {
    const day = next.getDay() || 7;
    next.setDate(next.getDate() - day + 1);
  }

  return next;
}

function createEmptySeries(startDate: Date, endDate: Date, granularity: string) {
  const series = new Map<string, {
    date: string;
    orders: number;
    quantity: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    averageOrderValue: number;
  }>();

  for (
    let cursor = startOfPeriod(startDate, granularity);
    cursor <= endDate;
    cursor = addPeriod(cursor, granularity)
  ) {
    const key = toDateKey(cursor);
    series.set(key, {
      date: key,
      orders: 0,
      quantity: 0,
      revenue: 0,
      cost: 0,
      grossProfit: 0,
      averageOrderValue: 0
    });
  }

  return series;
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = parseAnalyticsQuery(event);
  const filters = getPaidSalesFilters(query);

  const [salesRows, statusRows, paymentMethodRows, obtainingMethodRows, productOptions, categoryOptions] =
    await Promise.all([
      prisma.$queryRaw<SalesRow[]>`
        SELECT
          date_trunc(${query.granularity}, p."paid_at") AS "periodStart",
          COUNT(DISTINCT o."id")::int AS "orders",
          COALESCE(SUM(oi."quantity"), 0)::int AS "quantity",
          COALESCE(SUM(oi."line_total"), 0)::numeric AS "revenue",
          COALESCE(SUM(COALESCE(oi."cost_price", 0) * oi."quantity"), 0)::numeric AS "cost"
        FROM "payment" p
        JOIN "order" o ON o."id" = p."order_id"
        JOIN "order_item" oi ON oi."order_id" = o."id"
        WHERE ${filters}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      prisma.$queryRaw<BreakdownRow[]>`
        SELECT
          o."order_status"::text AS "key",
          COUNT(DISTINCT o."id")::int AS "orders"
        FROM "order" o
        WHERE o."created_at" >= ${query.startDate}
          AND o."created_at" <= ${query.endDate}
        GROUP BY 1
        ORDER BY 2 DESC
      `,
      prisma.$queryRaw<BreakdownRow[]>`
        SELECT
          o."payment_method"::text AS "key",
          COUNT(DISTINCT o."id")::int AS "orders",
          COALESCE(SUM(p."amount"), 0)::numeric AS "revenue"
        FROM "order" o
        LEFT JOIN "payment" p ON p."order_id" = o."id" AND p."payment_status" = 'PAID'
        WHERE o."created_at" >= ${query.startDate}
          AND o."created_at" <= ${query.endDate}
        GROUP BY 1
        ORDER BY 2 DESC
      `,
      prisma.$queryRaw<BreakdownRow[]>`
        SELECT
          o."obtaining_method"::text AS "key",
          COUNT(DISTINCT o."id")::int AS "orders",
          COALESCE(SUM(p."amount"), 0)::numeric AS "revenue"
        FROM "order" o
        LEFT JOIN "payment" p ON p."order_id" = o."id" AND p."payment_status" = 'PAID'
        WHERE o."created_at" >= ${query.startDate}
          AND o."created_at" <= ${query.endDate}
        GROUP BY 1
        ORDER BY 2 DESC
      `,
      getProductOptions(),
      getCategoryOptions()
    ]);

  const series = createEmptySeries(query.startDate, query.endDate, query.granularity);

  for (const row of salesRows) {
    const key = toDateKey(row.periodStart);
    const revenue = toNumber(row.revenue);
    const cost = toNumber(row.cost);
    const orders = toNumber(row.orders);
    const current = series.get(key) ?? {
      date: key,
      orders: 0,
      quantity: 0,
      revenue: 0,
      cost: 0,
      grossProfit: 0,
      averageOrderValue: 0
    };

    current.orders = orders;
    current.quantity = toNumber(row.quantity);
    current.revenue = revenue;
    current.cost = cost;
    current.grossProfit = revenue - cost;
    current.averageOrderValue = orders ? revenue / orders : 0;
    series.set(key, current);
  }

  const salesByPeriod = [...series.values()];
  const totals = salesByPeriod.reduce(
    (acc, item) => ({
      orders: acc.orders + item.orders,
      quantity: acc.quantity + item.quantity,
      revenue: acc.revenue + item.revenue,
      cost: acc.cost + item.cost,
      grossProfit: acc.grossProfit + item.grossProfit
    }),
    {
      orders: 0,
      quantity: 0,
      revenue: 0,
      cost: 0,
      grossProfit: 0
    }
  );

  return {
    period: {
      startDate: toDateKey(query.startDate),
      endDate: toDateKey(query.endDate),
      granularity: query.granularity
    },
    filters: {
      productId: query.productId ?? null,
      categoryId: query.categoryId ?? null
    },
    totals: {
      ...totals,
      averageOrderValue: totals.orders ? totals.revenue / totals.orders : 0,
      grossMargin: totals.revenue ? totals.grossProfit / totals.revenue : 0
    },
    salesByPeriod,
    breakdowns: {
      orderStatus: statusRows.map((row) => ({
        status: row.key,
        orders: toNumber(row.orders)
      })),
      paymentMethod: paymentMethodRows.map((row) => ({
        paymentMethod: row.key,
        orders: toNumber(row.orders),
        revenue: toNumber(row.revenue)
      })),
      obtainingMethod: obtainingMethodRows.map((row) => ({
        obtainingMethod: row.key,
        orders: toNumber(row.orders),
        revenue: toNumber(row.revenue)
      }))
    },
    productOptions,
    categoryOptions
  };
});
