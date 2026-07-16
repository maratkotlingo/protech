import { MessageSenderRole } from "@prisma/client";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "~~/server/utils/messageRealtime";

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);

  const unreadIncoming = await prisma.message.findMany({
    where: {
      userId,
      readAt: null,
      senderRole: {
        in: [MessageSenderRole.ADMIN, MessageSenderRole.SYSTEM]
      }
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

    broadcastMessageToUser(userId, eventPayload);
    broadcastMessageToAdmins(eventPayload);
  }

  const messages = await prisma.message.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return { messages };
});
