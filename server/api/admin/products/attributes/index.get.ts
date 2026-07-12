export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const attributes = await prisma.attribute.findMany({
    include: {
      _count: {
        select: { productAttributes: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return attributes;
});
