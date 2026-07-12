import {
  OrderStatus,
  PaymentStatus,
  Prisma
} from "@prisma/client";
import { reserveProductStock, restoreOrderStock } from "~~/server/utils/orderStock";
import { createYooKassaPayment } from "~~/server/utils/yookassa";
import { createOrderSchema } from "~~/shared/schemas/user/orders/createOrder"

const orderInclude = {
  orderItems: true,
  delivery: true,
  payment: true
} satisfies Prisma.OrderInclude;

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы неавторизованы"
    })
  }

  const user = session.user;

  const result = await readValidatedBody(event, (body) => createOrderSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Ошибка валидации данных',
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    })
  }

  const body = result.data

  const order = await prisma.$transaction(async (tx) => {
    const productIds = body.orderItems.map((item) => item.productId);

    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        currentPrice: true,
        isActive: true,
        productStocks: {
          select: { quantity: true }
        }
      }
    });

    if (products.length !== productIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "Один или несколько товаров не найдены"
      });
    }

    for (const product of products) {
      if (!product.isActive) {
        throw createError({
          statusCode: 400,
          statusMessage: `Товар с ID ${product.id} недоступен для заказа`
        });
      }
    }

    for (const item of body.orderItems) {
      const product = products.find((p) => p.id === item.productId);
      const stock = product?.productStocks[0]?.quantity ?? 0;

      if (stock < item.quantity) {
        throw createError({
          statusCode: 400,
          statusMessage: `Недостаточно товара с ID ${item.productId} на складе`
        });
      }
    }

    const priceByProductId = new Map<number, Prisma.Decimal>(
      products.map((product) => [
        product.id,
        new Prisma.Decimal(product.currentPrice)
      ])
    );

    const getProductPrice = (productId: number): Prisma.Decimal => {
      const price = priceByProductId.get(productId);

      if (!price) {
        throw createError({
          statusCode: 400,
          statusMessage: `Товар с ID ${productId} не найден`
        });
      }

      return price;
    };

    const totalAmount = body.orderItems.reduce<Prisma.Decimal>((sum, item) => {
      const price = getProductPrice(item.productId);

      return sum.add(price.mul(item.quantity));
    }, new Prisma.Decimal(0));

    if (totalAmount.lte(0)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Сумма заказа должна быть больше нуля"
      });
    }

    const createdOrder = await tx.order.create({
      data: {
        userId: user.id,
        obtainingMethod: body.obtainingMethod,
        paymentMethod: body.paymentMethod,
        stockReserved: true,

        orderStatus:
          body.paymentMethod === "ONLINE"
            ? OrderStatus.NEW
            : OrderStatus.CONFIRMED,

        orderItems: {
          create: body.orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: priceByProductId.get(item.productId)!
          }))
        },

        delivery:
          body.obtainingMethod === "DELIVERY"
            ? {
              create: {
                address: body.delivery.address,
                apartment: body.delivery.apartment,
                entrance: body.delivery.entrance,
                floor: body.delivery.floor,
                intercom: body.delivery.intercom,
                comment: body.delivery.comment,
                deliveryMethod: body.delivery.deliveryMethod
              }
            }
            : undefined,

        payment: {
          create: {
            paymentStatus:
              body.paymentMethod === "ONLINE"
                ? PaymentStatus.PENDING
                : PaymentStatus.UPON_RECEIPT,

            amount: totalAmount
          }
        }
      },
      include: orderInclude
    });

    await reserveProductStock(tx, body.orderItems);

    return createdOrder;
  });

  if (body.paymentMethod === "OFFLINE") {
    return {
      order,
      payment: {
        type: "offline",
        confirmationUrl: null
      }
    };
  }

  const yookassaPayment = await createYooKassaPayment(event, {
    orderId: order.id,
    amount: order.payment!.amount,
    description: `Заказ №${order.id}`
  }).catch(async (error) => {
    await prisma.$transaction(async (tx) => {
      await restoreOrderStock(tx, order.id);

      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          paidAt: null
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          stockReserved: false
        }
      });
    });

    throw error;
  });

  await prisma.payment.update({
    where: {
      orderId: order.id
    },
    data: {
      transactionId: yookassaPayment.id
    }
  });

  const updatedOrder = await prisma.order.findUniqueOrThrow({
    where: {
      id: order.id
    },
    include: orderInclude
  });

  return {
    order: updatedOrder,
    payment: {
      type: "yookassa",
      status: yookassaPayment.status,
      confirmationUrl: yookassaPayment.confirmation?.confirmation_url ?? null
    }
  };
});
