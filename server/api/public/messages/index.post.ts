import { MessageSenderRole, MessageType } from "@prisma/client";
import { sendMessageSchema } from "~~/shared/schemas/messages/message";
import { broadcastMessageToAdmins, broadcastMessageToUser } from "~~/server/utils/messageRealtime";

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const body = await validateBody(event, sendMessageSchema);

  const message = await prisma.message.create({
    data: {
      userId,
      messageType: MessageType.SUPPORT,
      senderRole: MessageSenderRole.USER,
      message: body.message
    }
  });

  const payload = {
    type: "message.created" as const,
    message
  };

  broadcastMessageToUser(userId, payload);
  broadcastMessageToAdmins(payload);

  return { message };
});
