import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { $fetch, setup } from "@nuxt/test-utils/e2e";
import {
  MessageSenderRole,
  MessageType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Role
} from "@prisma/client";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../server/utils/prisma";
import { expireUnpaidOrders } from "../../server/utils/orderExpiry";

const mockYooKassaPayments = new Map<string, unknown>();
const mockYooKassaCreateRequests: Array<{ body: Record<string, unknown> }> = [];
const mockYooKassaServer: Server = createServer((request, response) => {
  const url = request.url ?? "";
  const paymentId = url.startsWith("/v3/payments/")
    ? decodeURIComponent(url.slice("/v3/payments/".length))
    : null;
  const payment = paymentId ? mockYooKassaPayments.get(paymentId) : null;

  if (request.method === "GET" && payment) {
    response.writeHead(200, {
      "Content-Type": "application/json"
    });
    response.end(JSON.stringify(payment));
    return;
  }

  if (request.method === "POST" && url === "/v3/payments") {
    let rawBody = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      rawBody += chunk;
    });
    request.on("end", () => {
      const body = JSON.parse(rawBody || "{}") as Record<string, unknown>;
      const id = `mock-yookassa-${randomUUID()}`;
      const payment = {
        id,
        status: "pending",
        paid: false,
        amount: body.amount,
        confirmation: {
          type: "redirect",
          confirmation_url: `https://yookassa.test/payments/${id}`
        },
        metadata: body.metadata
      };

      mockYooKassaCreateRequests.push({ body });
      mockYooKassaPayments.set(id, payment);
      response.writeHead(200, {
        "Content-Type": "application/json"
      });
      response.end(JSON.stringify(payment));
    });
    return;
  }

  response.writeHead(404, {
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify({ error: "not_found" }));
});

await new Promise<void>((resolve) => {
  mockYooKassaServer.listen(0, "127.0.0.1", resolve);
});

const mockYooKassaAddress = mockYooKassaServer.address() as AddressInfo;

process.env.RATE_LIMIT_DISABLED = "true";
process.env.ORDER_EXPIRY_JOB_DISABLED = "true";
process.env.YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || "test-shop";
process.env.YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || "test-secret";
process.env.YOOKASSA_API_URL = `http://127.0.0.1:${mockYooKassaAddress.port}`;
process.env.YOOKASSA_RETURN_URL = "http://localhost:3000/";

await setup({
  server: true,
  browser: false,
  setupTimeout: 120_000,
  env: {
    RATE_LIMIT_DISABLED: "true",
    ORDER_EXPIRY_JOB_DISABLED: "true",
    YOOKASSA_SHOP_ID: process.env.YOOKASSA_SHOP_ID,
    YOOKASSA_SECRET_KEY: process.env.YOOKASSA_SECRET_KEY,
    YOOKASSA_API_URL: process.env.YOOKASSA_API_URL,
    YOOKASSA_RETURN_URL: process.env.YOOKASSA_RETURN_URL
  }
});

const testPrefix = `it-${randomUUID()}`;

type TestUser = {
  id: string;
  token: string;
  headers: Record<string, string>;
};

type TestProduct = {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  article: string;
  mainImage: string;
  currentPrice: Prisma.Decimal;
  costPrice: Prisma.Decimal;
};

async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: testPrefix
      }
    },
    select: {
      id: true
    }
  });

  const userIds = users.map((user) => user.id);

  if (userIds.length) {
    await prisma.order.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    await prisma.cart.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    await prisma.session.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    await prisma.account.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });
  }

  await prisma.product.deleteMany({
    where: {
      article: {
        startsWith: testPrefix
      }
    }
  });

  await prisma.category.deleteMany({
    where: {
      name: {
        startsWith: testPrefix
      }
    }
  });
}

async function createTestUser(role: Role = Role.USER): Promise<TestUser> {
  const id = randomUUID();
  const token = `${testPrefix}-token-${id}`;

  const user = await prisma.user.create({
    data: {
      email: `${testPrefix}-${id}@example.com`,
      name: `Test ${id}`,
      role
    }
  });

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60_000)
    }
  });

  return {
    id: user.id,
    token,
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}

async function createTestProduct(quantity = 10): Promise<TestProduct> {
  const id = randomUUID();

  const category = await prisma.category.create({
    data: {
      name: `${testPrefix}-category-${id}`
    }
  });

  const product = await prisma.product.create({
    data: {
      name: `Product ${id}`,
      description: "Integration test product",
      currentPrice: new Prisma.Decimal("100.00"),
      costPrice: new Prisma.Decimal("60.00"),
      article: `${testPrefix}-article-${id}`,
      mainImage: "/uploads/test.png",
      categoryId: category.id,
      isActive: true,
      productPrices: {
        create: {
          value: new Prisma.Decimal("100.00")
        }
      },
      productStocks: {
        create: {
          quantity
        }
      }
    }
  });

  return {
    id: product.id,
    categoryId: category.id,
    categoryName: category.name,
    name: product.name,
    article: product.article,
    mainImage: product.mainImage,
    currentPrice: new Prisma.Decimal(product.currentPrice),
    costPrice: new Prisma.Decimal(product.costPrice!)
  };
}

function createOrderItemData(product: TestProduct, quantity: number) {
  return {
    productId: product.id,
    quantity,
    price: product.currentPrice,
    costPrice: product.costPrice,
    lineTotal: product.currentPrice.mul(quantity),
    productName: product.name,
    productArticle: product.article,
    productMainImage: product.mainImage,
    categoryId: product.categoryId,
    categoryName: product.categoryName
  };
}

async function getStockQuantity(productId: number) {
  const stock = await prisma.productStock.findUniqueOrThrow({
    where: { productId },
    select: { quantity: true }
  });

  return stock.quantity;
}

afterEach(async () => {
  mockYooKassaPayments.clear();
  mockYooKassaCreateRequests.length = 0;
  await cleanupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await new Promise<void>((resolve, reject) => {
    mockYooKassaServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
  await prisma.$disconnect();
});

describe("cart/order integration", () => {
  it("adds, updates, lists and removes cart items", async () => {
    const user = await createTestUser();
    const product = await createTestProduct();

    const added = await $fetch<{ success: boolean; cartItem: { quantity: number } }>(
      `/api/public/cart/add/${product.id}`,
      {
        method: "POST",
        headers: user.headers
      }
    );

    expect(added.success).toBe(true);
    expect(added.cartItem.quantity).toBe(1);

    const updated = await $fetch<{ success: boolean; cartItem: { quantity: number } }>(
      `/api/public/cart/update/${product.id}`,
      {
        method: "POST",
        headers: user.headers,
        body: { quantity: 3 }
      }
    );

    expect(updated.cartItem.quantity).toBe(3);

    const cart = await $fetch<Array<{ quantity: number; product: { id: number } }>>(
      "/api/public/cart",
      {
        headers: user.headers
      }
    );

    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({
      quantity: 3,
      product: {
        id: product.id
      }
    });

    const removed = await $fetch<{ success: boolean; deletedCount: number }>(
      "/api/public/cart/delete/many",
      {
        method: "POST",
        headers: user.headers,
        body: { productIds: [product.id, product.id] }
      }
    );

    expect(removed).toEqual({
      success: true,
      deletedCount: 1
    });
  });

  it("does not allow cart quantity to exceed available stock", async () => {
    const user = await createTestUser();
    const product = await createTestProduct(1);

    await $fetch(`/api/public/cart/add/${product.id}`, {
      method: "POST",
      headers: user.headers
    });

    await expect($fetch(`/api/public/cart/add/${product.id}`, {
      method: "POST",
      headers: user.headers
    })).rejects.toMatchObject({
      statusCode: 409
    });

    await expect($fetch(`/api/public/cart/update/${product.id}`, {
      method: "POST",
      headers: user.headers,
      body: { quantity: 2 }
    })).rejects.toMatchObject({
      statusCode: 409
    });
  });

  it("creates an offline pickup order and reserves product stock", async () => {
    const user = await createTestUser();
    const product = await createTestProduct(5);

    const response = await $fetch<{
      order: {
        id: number;
        orderStatus: OrderStatus;
        customerPhone: string | null;
        stockReserved: boolean;
        payment: {
          paymentStatus: PaymentStatus;
        };
      };
      payment: {
        type: string;
        confirmationUrl: string | null;
      };
    }>("/api/public/orders", {
      method: "POST",
      headers: user.headers,
      body: {
        obtainingMethod: "PICKUP",
        paymentMethod: "OFFLINE",
        customerPhone: "+7 900 123-45-67",
        orderItems: [
          {
            productId: product.id,
            quantity: 2
          }
        ]
      }
    });

    expect(response.order.orderStatus).toBe(OrderStatus.CONFIRMED);
    expect(response.order.customerPhone).toBe("+7 900 123-45-67");
    expect(response.order.stockReserved).toBe(true);
    expect(response.order.payment.paymentStatus).toBe(PaymentStatus.UPON_RECEIPT);
    expect(response.payment).toEqual({
      type: "offline",
      confirmationUrl: null
    });
    expect(await getStockQuantity(product.id)).toBe(3);
  });

  it("creates an online YooKassa payment with a return URL for the order", async () => {
    const user = await createTestUser();
    const product = await createTestProduct(5);

    const response = await $fetch<{
      order: {
        id: number;
        customerPhone: string | null;
        payment: {
          paymentStatus: PaymentStatus;
        };
      };
      payment: {
        type: string;
        confirmationUrl: string | null;
      };
    }>("/api/public/orders", {
      method: "POST",
      headers: user.headers,
      body: {
        obtainingMethod: "PICKUP",
        paymentMethod: "ONLINE",
        customerPhone: "+7 900 765-43-21",
        orderItems: [
          {
            productId: product.id,
            quantity: 2
          }
        ]
      }
    });

    const createRequest = mockYooKassaCreateRequests.at(-1);
    const confirmation = createRequest?.body.confirmation as { return_url?: string } | undefined;

    expect(response.payment.type).toBe("yookassa");
    expect(response.payment.confirmationUrl).toMatch(/^https:\/\/yookassa\.test\/payments\//);
    expect(response.order.customerPhone).toBe("+7 900 765-43-21");
    expect(response.order.payment.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(confirmation?.return_url).toBe(`http://localhost:3000/orders/${response.order.id}`);
  });

  it("syncs pending YooKassa payments when listing orders", async () => {
    const user = await createTestUser();
    const product = await createTestProduct(3);
    const transactionId = `${testPrefix}-yk-${randomUUID()}`;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        obtainingMethod: "PICKUP",
        paymentMethod: PaymentMethod.ONLINE,
        orderStatus: OrderStatus.NEW,
        stockReserved: false,
        orderItems: {
          create: createOrderItemData(product, 2)
        },
        payment: {
          create: {
            paymentStatus: PaymentStatus.PENDING,
            amount: new Prisma.Decimal("200.00"),
            transactionId
          }
        }
      }
    });

    mockYooKassaPayments.set(transactionId, {
      id: transactionId,
      status: "succeeded",
      paid: true,
      amount: {
        value: "200.00",
        currency: "RUB"
      },
      metadata: {
        orderId: String(order.id)
      }
    });

    const orders = await $fetch<Array<{
      id: number;
      orderStatus: OrderStatus;
      stockReserved: boolean;
      payment: {
        paymentStatus: PaymentStatus;
      } | null;
    }>>("/api/public/orders", {
      headers: user.headers
    });

    const syncedOrder = orders.find((item) => item.id === order.id);

    expect(syncedOrder?.orderStatus).toBe(OrderStatus.CONFIRMED);
    expect(syncedOrder?.stockReserved).toBe(true);
    expect(syncedOrder?.payment?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(await getStockQuantity(product.id)).toBe(1);
  });

  it("processes a successful YooKassa webhook", async () => {
    const user = await createTestUser();
    const product = await createTestProduct(1);
    const transactionId = `${testPrefix}-yk-${randomUUID()}`;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        obtainingMethod: "PICKUP",
        paymentMethod: PaymentMethod.ONLINE,
        orderStatus: OrderStatus.NEW,
        stockReserved: true,
        orderItems: {
          create: createOrderItemData(product, 2)
        },
        payment: {
          create: {
            paymentStatus: PaymentStatus.PENDING,
            amount: new Prisma.Decimal("200.00"),
            transactionId
          }
        }
      }
    });

    mockYooKassaPayments.set(transactionId, {
      id: transactionId,
      status: "succeeded",
      paid: true,
      amount: {
        value: "200.00",
        currency: "RUB"
      },
      metadata: {
        orderId: String(order.id)
      }
    });

    const webhookResponse = await $fetch<{ ok: boolean }>(
      "/api/public/payments/yookassa/webhook",
      {
        method: "POST",
        body: {
          type: "notification",
          event: "payment.succeeded",
          object: {
            id: transactionId,
            status: "succeeded",
            paid: true
          }
        }
      }
    );

    expect(webhookResponse).toEqual({ ok: true });

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { orderId: order.id },
      include: {
        order: true
      }
    });

    expect(payment.paymentStatus).toBe(PaymentStatus.PAID);
    expect(payment.order.orderStatus).toBe(OrderStatus.CONFIRMED);
    expect(payment.order.stockReserved).toBe(true);
    expect(await getStockQuantity(product.id)).toBe(1);
  });

  it("cancels and restores an order status while updating stock", async () => {
    const user = await createTestUser();
    const admin = await createTestUser(Role.ADMIN);
    const product = await createTestProduct(1);

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        obtainingMethod: "PICKUP",
        paymentMethod: PaymentMethod.OFFLINE,
        orderStatus: OrderStatus.CONFIRMED,
        stockReserved: true,
        orderItems: {
          create: createOrderItemData(product, 2)
        },
        payment: {
          create: {
            paymentStatus: PaymentStatus.UPON_RECEIPT,
            amount: new Prisma.Decimal("200.00")
          }
        }
      }
    });

    const cancelled = await $fetch<{ success: boolean; order: { orderStatus: OrderStatus; stockReserved: boolean } }>(
      `/api/admin/orders/${order.id}/status`,
      {
        method: "POST",
        headers: admin.headers,
        body: {
          orderStatus: OrderStatus.CANCELLED
        }
      }
    );

    expect(cancelled.order).toMatchObject({
      orderStatus: OrderStatus.CANCELLED,
      stockReserved: false
    });
    expect(await getStockQuantity(product.id)).toBe(3);

    const restored = await $fetch<{ success: boolean; order: { orderStatus: OrderStatus; stockReserved: boolean } }>(
      `/api/admin/orders/${order.id}/status`,
      {
        method: "POST",
        headers: admin.headers,
        body: {
          orderStatus: OrderStatus.CONFIRMED
        }
      }
    );

    expect(restored.order).toMatchObject({
      orderStatus: OrderStatus.CONFIRMED,
      stockReserved: true
    });
    expect(await getStockQuantity(product.id)).toBe(1);

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { orderId: order.id }
    });

    expect(payment.paymentStatus).toBe(PaymentStatus.UPON_RECEIPT);

    const statusMessages = await prisma.message.findMany({
      where: {
        userId: user.id,
        messageType: MessageType.DELIVERY,
        senderRole: MessageSenderRole.SYSTEM
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    expect(statusMessages).toHaveLength(2);
    expect(statusMessages[0]?.message).toContain(String(order.id));
    expect(statusMessages[1]?.message).toContain(String(order.id));
  });

  it("expires unpaid online orders and releases reserved stock", async () => {
    const user = await createTestUser();
    const product = await createTestProduct(1);

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        obtainingMethod: "PICKUP",
        paymentMethod: PaymentMethod.ONLINE,
        orderStatus: OrderStatus.NEW,
        stockReserved: true,
        createdAt: new Date(Date.now() - 60 * 60_000),
        orderItems: {
          create: createOrderItemData(product, 2)
        },
        payment: {
          create: {
            paymentStatus: PaymentStatus.PENDING,
            amount: new Prisma.Decimal("200.00")
          }
        }
      }
    });

    const result = await expireUnpaidOrders({
      expiresBefore: new Date()
    });

    expect(result.orderIds).toContain(order.id);

    const expiredOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { payment: true }
    });

    expect(expiredOrder.orderStatus).toBe(OrderStatus.CANCELLED);
    expect(expiredOrder.stockReserved).toBe(false);
    expect(expiredOrder.payment?.paymentStatus).toBe(PaymentStatus.CANCELLED);
    expect(await getStockQuantity(product.id)).toBe(3);
  });

  it("returns sales, product and inventory analytics for admin charts", async () => {
    const user = await createTestUser();
    const admin = await createTestUser(Role.ADMIN);
    const product = await createTestProduct(8);
    const paidAt = new Date();

    await prisma.order.create({
      data: {
        userId: user.id,
        obtainingMethod: "PICKUP",
        paymentMethod: PaymentMethod.ONLINE,
        orderStatus: OrderStatus.CONFIRMED,
        stockReserved: true,
        orderItems: {
          create: createOrderItemData(product, 3)
        },
        payment: {
          create: {
            paymentStatus: PaymentStatus.PAID,
            amount: new Prisma.Decimal("300.00"),
            paidAt
          }
        }
      }
    });

    await $fetch(`/api/admin/products/stock/update/${product.id}`, {
      method: "POST",
      headers: admin.headers,
      body: {
        quantity: 4
      }
    });

    const sales = await $fetch<{
      totals: {
        orders: number;
        quantity: number;
        revenue: number;
        cost: number;
        grossProfit: number;
      };
      salesByPeriod: Array<{ revenue: number }>;
    }>("/api/admin/analytics/sales", {
      headers: admin.headers
    });

    expect(sales.totals).toMatchObject({
      orders: 1,
      quantity: 3,
      revenue: 300,
      cost: 180,
      grossProfit: 120
    });
    expect(sales.salesByPeriod.some((item) => item.revenue === 300)).toBe(true);

    const products = await $fetch<{
      items: Array<{
        productId: number;
        revenue: number;
        grossProfit: number;
        currentStock: number;
      }>;
    }>("/api/admin/analytics/products", {
      headers: admin.headers
    });

    expect(products.items[0]).toMatchObject({
      productId: product.id,
      revenue: 300,
      grossProfit: 120,
      currentStock: 4
    });

    const inventory = await $fetch<{
      movementsByPeriod: Array<{ type: string; quantityDelta: number }>;
    }>("/api/admin/analytics/inventory", {
      headers: admin.headers
    });

    expect(
      inventory.movementsByPeriod.some((item) => item.type === "ADJUSTMENT" && item.quantityDelta === -4)
    ).toBe(true);
  });
});
