export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true
    }
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Пользователь не найден"
    });
  }

  return { user };
});
