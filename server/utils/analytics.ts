import { Prisma } from "@prisma/client";
import { getQuery, type H3Event } from "h3";
import { prisma } from "./prisma";

export type AnalyticsGranularity = "day" | "week" | "month";
export type AnalyticsSortBy = "revenue" | "quantity" | "orders" | "profit";

export type AnalyticsQuery = {
  startDate: Date;
  endDate: Date;
  granularity: AnalyticsGranularity;
  productId?: number;
  categoryId?: number;
  limit: number;
  sortBy: AnalyticsSortBy;
};

const granularitySet = new Set<AnalyticsGranularity>(["day", "week", "month"]);
const sortBySet = new Set<AnalyticsSortBy>(["revenue", "quantity", "orders", "profit"]);

function parseDate(value: unknown) {
  if (!value) return null;

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function toPositiveInt(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function clampLimit(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 200) : 20;
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseAnalyticsQuery(event: H3Event): AnalyticsQuery {
  const query = getQuery(event);
  const endDate = endOfDay(parseDate(query.endDate) ?? new Date());
  const defaultStartDate = new Date(endDate);
  defaultStartDate.setDate(defaultStartDate.getDate() - 29);

  const startDate = startOfDay(parseDate(query.startDate) ?? defaultStartDate);
  const granularity = granularitySet.has(String(query.granularity) as AnalyticsGranularity)
    ? String(query.granularity) as AnalyticsGranularity
    : "day";
  const sortBy = sortBySet.has(String(query.sortBy) as AnalyticsSortBy)
    ? String(query.sortBy) as AnalyticsSortBy
    : "revenue";

  return {
    startDate: startDate <= endDate ? startDate : startOfDay(endDate),
    endDate: startDate <= endDate ? endDate : endOfDay(startDate),
    granularity,
    productId: toPositiveInt(query.productId),
    categoryId: toPositiveInt(query.categoryId),
    limit: clampLimit(query.limit),
    sortBy
  };
}

export function toNumber(value: unknown) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export function getPaidSalesFilters(query: AnalyticsQuery) {
  const filters: Prisma.Sql[] = [
    Prisma.sql`p."payment_status" = 'PAID'`,
    Prisma.sql`p."paid_at" IS NOT NULL`,
    Prisma.sql`p."paid_at" >= ${query.startDate}`,
    Prisma.sql`p."paid_at" <= ${query.endDate}`,
    Prisma.sql`o."order_status" <> 'CANCELLED'`
  ];

  if (query.productId) {
    filters.push(Prisma.sql`oi."product_id" = ${query.productId}`);
  }

  if (query.categoryId) {
    filters.push(Prisma.sql`oi."category_id" = ${query.categoryId}`);
  }

  return Prisma.join(filters, " AND ");
}

export async function getProductOptions() {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      article: true,
      categoryId: true
    },
    orderBy: {
      name: "asc"
    }
  });
}

export async function getCategoryOptions() {
  return await prisma.category.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: "asc"
    }
  });
}
