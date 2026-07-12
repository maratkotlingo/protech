export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы не авторизованы",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Пользователь не найден",
    });
  }

  return { user };
});
