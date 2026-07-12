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

  return prisma.order.findMany({
    where: {
      userId
    },
    include: orderInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
});
