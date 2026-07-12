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
  const session = await auth.api.getSession({
    headers: event.headers
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы не авторизованы"
    });
  }

  return prisma.order.findMany({
    where: {
      userId: session.user.id
    },
    include: orderInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
});
