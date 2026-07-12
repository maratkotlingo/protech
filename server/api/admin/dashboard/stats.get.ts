type SortBy = "quantity" | "revenue" | "orders";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value: unknown) {
  if (!value) return null;

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;

  return date;
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

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const period = String(query.period ?? "30");
  const sortBy = (["quantity", "revenue", "orders"].includes(String(query.sortBy))
    ? String(query.sortBy)
    : "quantity") as SortBy;
  const selectedProductId = getOptionalPositiveIntQueryParam(query.productId) ?? null;
  const endDateParam = parseDate(query.endDate);
  const startDateParam = parseDate(query.startDate);
  const defaultEndDate = endOfDay(new Date());
  const endDate = endOfDay(endDateParam ?? defaultEndDate);
  const daysByPeriod: Record<string, number> = {
    "7": 7,
    "30": 30,
    "90": 90,
  };
  const periodDays = daysByPeriod[period] ?? 30;
  const fallbackStartDate = new Date(endDate);
  fallbackStartDate.setDate(fallbackStartDate.getDate() - periodDays + 1);

  let startDate = startOfDay(period === "custom" && startDateParam ? startDateParam : fallbackStartDate);
  let rangeEndDate = endDate;

  if (startDate > rangeEndDate) {
    [startDate, rangeEndDate] = [startOfDay(rangeEndDate), endOfDay(startDate)];
  }

  const [
    productsTotal,
    productsActive,
    ordersTotal,
    ordersNew,
    reviewsPending,
    faqPending,
    lowStock,
    revenuePaid,
    productOptions,
    paidOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: "NEW" } }),
    prisma.review.count({ where: { OR: [{ isAnswered: false }, { isAnswered: null }] } }),
    prisma.shopQuestion.count({ where: { OR: [{ isAnswered: false }, { isAnswered: null }] } }),
    prisma.productStock.count({ where: { quantity: { lte: 5 } } }),
    prisma.payment.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { amount: true }
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        article: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: rangeEndDate,
        },
        orderStatus: {
          not: "CANCELLED",
        },
        payment: {
          is: {
            paymentStatus: "PAID",
          },
        },
      },
      select: {
        id: true,
        createdAt: true,
        orderItems: {
          select: {
            productId: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                article: true,
                mainImage: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const dayFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  });
  const dailyOrderIds = new Map<string, Set<number>>();
  const dailySales = new Map<
    string,
    { date: string; label: string; quantity: number; orders: number; revenue: number }
  >();
  const productSales = new Map<
    number,
    {
      productId: number;
      name: string;
      article: string;
      mainImage: string;
      quantity: number;
      revenue: number;
      orderIds: Set<number>;
    }
  >();
  const totalOrderIds = new Set<number>();

  for (const cursor = new Date(startDate); cursor <= rangeEndDate; cursor.setDate(cursor.getDate() + 1)) {
    const key = toDateKey(cursor);
    dailyOrderIds.set(key, new Set());
    dailySales.set(key, {
      date: key,
      label: dayFormatter.format(cursor),
      quantity: 0,
      orders: 0,
      revenue: 0,
    });
  }

  for (const order of paidOrders) {
    const dayKey = toDateKey(order.createdAt);
    const day = dailySales.get(dayKey);
    let orderMatchesSelectedProduct = false;

    for (const item of order.orderItems) {
      const price = Number(item.price);
      const revenue = price * item.quantity;
      const product = item.product;
      const productStats =
        productSales.get(item.productId) ??
        {
          productId: product.id,
          name: product.name,
          article: product.article,
          mainImage: product.mainImage,
          quantity: 0,
          revenue: 0,
          orderIds: new Set<number>(),
        };

      productStats.quantity += item.quantity;
      productStats.revenue += revenue;
      productStats.orderIds.add(order.id);
      productSales.set(item.productId, productStats);

      if (selectedProductId && item.productId !== selectedProductId) {
        continue;
      }

      if (day) {
        day.quantity += item.quantity;
        day.revenue += revenue;
      }
      orderMatchesSelectedProduct = true;
    }

    if (orderMatchesSelectedProduct) {
      dailyOrderIds.get(dayKey)?.add(order.id);
      totalOrderIds.add(order.id);
    }
  }

  const salesByDay = [...dailySales.values()].map((day) => ({
    ...day,
    orders: dailyOrderIds.get(day.date)?.size ?? 0,
  }));
  const totalQuantity = salesByDay.reduce((sum, day) => sum + day.quantity, 0);
  const totalRevenue = salesByDay.reduce((sum, day) => sum + day.revenue, 0);
  const sortedProductSales = [...productSales.values()]
    .map(({ orderIds, ...product }) => ({
      ...product,
      orders: orderIds.size,
    }))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderStatus: true,
      paymentMethod: true,
      obtainingMethod: true,
      createdAt: true,
      updatedAt: true,
      payment: { select: { amount: true, paymentStatus: true, paidAt: true } },
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { orderItems: true } }
    }
  });

  return {
    stats: {
      productsTotal,
      productsActive,
      ordersTotal,
      ordersNew,
      reviewsPending,
      faqPending,
      lowStock,
      revenuePaid: revenuePaid._sum.amount ?? 0
    },
    recentOrders,
    analytics: {
      period: {
        startDate: toDateKey(startDate),
        endDate: toDateKey(rangeEndDate),
        days: salesByDay.length,
      },
      selectedProductId: selectedProductId && Number.isInteger(selectedProductId) ? selectedProductId : null,
      totals: {
        quantity: totalQuantity,
        orders: totalOrderIds.size,
        revenue: totalRevenue,
        averageOrderValue: totalOrderIds.size ? totalRevenue / totalOrderIds.size : 0,
      },
      salesByDay,
      productSales: sortedProductSales,
      productOptions,
    },
  };
});
