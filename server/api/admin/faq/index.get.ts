import { Prisma } from "@prisma/client";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = getPageQueryParam(query.page);
  const pending = query.pending === "true";
  const limit = 20;

  const where: Prisma.ShopQuestionWhereInput = pending
    ? { OR: [{ isAnswered: false }, { isAnswered: null }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.shopQuestion.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        shopQuestionImages: true,
        shopAnswers: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    }),
    prisma.shopQuestion.count({ where })
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
});
