import { Prisma } from "@prisma/client";

const orderInclude = {
  orderItems: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          mainImage: true
        }
      }
    }
  },
  delivery: true,
  payment: true
} satisfies Prisma.OrderInclude;

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const orderId = getPositiveIntRouterParam(event, "orderId", "Некорректный ID заказа");

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    },
    include: orderInclude
  });

  if (!order) {
    throw createError({
      statusCode: 404,
      message: "Заказ не найден"
    });
  }

  return order;
});
