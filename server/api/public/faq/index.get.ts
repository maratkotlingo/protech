export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const currentPage = getPageQueryParam(query.page);
  const limit = 20;

  const questions = await prisma.shopQuestion.findMany({
    skip: (currentPage - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      shopQuestionImages: true,
      shopAnswers: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      },
      user: {
        select: { id: true, name: true }
      }
    }
  });

  return questions;
});
