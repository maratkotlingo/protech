import { Role } from "@prisma/client";
import type { H3Event } from "h3";

export async function requireAdmin(event: H3Event) {
  const session = await auth.api.getSession({
    headers: event.headers
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы неавторизованы"
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true }
  });

  if (!user || user.role !== Role.ADMIN) {
    throw createError({
      statusCode: 403,
      message: "Доступ запрещён"
    });
  }

  return { session, userId: user.id };
}
