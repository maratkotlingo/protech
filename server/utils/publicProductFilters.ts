import type { Prisma } from "@prisma/client";
import { createError } from "h3";

export type PublicProductQueryValue = string | string[] | undefined;

export interface PublicProductFilterQuery {
  search?: PublicProductQueryValue;
  minPrice?: PublicProductQueryValue;
  maxPrice?: PublicProductQueryValue;
  categoryId?: PublicProductQueryValue;
  discountOnly?: PublicProductQueryValue;
  inStockOnly?: PublicProductQueryValue;
  attributes?: PublicProductQueryValue;
}

interface AttributeFilter {
  attributeId: number;
  value: string;
}

export function getPublicProductQueryValue(value: PublicProductQueryValue) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return typeof firstValue === "string" ? firstValue : undefined;
}

function parseAttributes(attributes?: PublicProductQueryValue): AttributeFilter[] {
  const rawAttributes = getPublicProductQueryValue(attributes);

  if (!rawAttributes) return [];

  try {
    const parsed = JSON.parse(rawAttributes);

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

function toFiniteNumber(value?: PublicProductQueryValue) {
  const parsed = Number(getPublicProductQueryValue(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPositiveInteger(value?: PublicProductQueryValue) {
  const parsed = Number(getPublicProductQueryValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function buildPublicProductWhere(
  query: PublicProductFilterQuery,
  options: { includePriceFilter?: boolean } = {}
): Prisma.ProductWhereInput {
  const includePriceFilter = options.includePriceFilter ?? true;
  const search = getPublicProductQueryValue(query.search)?.trim();
  const minPrice = toFiniteNumber(query.minPrice);
  const maxPrice = toFiniteNumber(query.maxPrice);
  const categoryId = toPositiveInteger(query.categoryId);
  const discountOnly = ["1", "true"].includes(getPublicProductQueryValue(query.discountOnly) ?? "");
  const inStockOnly = ["1", "true"].includes(getPublicProductQueryValue(query.inStockOnly) ?? "");
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

  return {
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

    ...(includePriceFilter && (minPrice !== undefined || maxPrice !== undefined)
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

    ...(inStockOnly
      ? {
        productStocks: {
          some: {
            quantity: {
              gt: 0
            }
          }
        }
      }
      : {}),

    ...(attributeFilters.length > 0
      ? {
        AND: attributeFilters
      }
      : {})
  };
}
