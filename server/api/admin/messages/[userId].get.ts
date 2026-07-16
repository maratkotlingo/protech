import { MessageSenderRole, Role } from "@prisma/client";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "~~/server/utils/messageRealtime";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const userId = getRouterParam(event, "userId");

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID пользователя"
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: Role.USER
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true
    }
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      message: "Пользователь не найден"
    });
  }

  const unreadIncoming = await prisma.message.findMany({
    where: {
      userId,
      senderRole: MessageSenderRole.USER,
      readAt: null
    },
    select: {
      id: true
    }
  });

  if (unreadIncoming.length) {
    const messageIds = unreadIncoming.map((message) => message.id);

    await prisma.message.updateMany({
      where: {
        id: { in: messageIds }
      },
      data: {
        readAt: new Date()
      }
    });

    const eventPayload = {
      type: "message.read" as const,
      messageIds,
      userId
    };

    broadcastMessageToAdmins(eventPayload);
    broadcastMessageToUser(userId, eventPayload);
  }

  const messages = await prisma.message.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return {
    user,
    messages
  };
});
