import { MessageSenderRole, Role } from "@prisma/client";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const [users, unreadCounts] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: Role.USER
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        message: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        },
        _count: {
          select: {
            message: true
          }
        }
      }
    }),
    prisma.message.groupBy({
      by: ["userId"],
      where: {
        senderRole: MessageSenderRole.USER,
        readAt: null
      },
      _count: {
        _all: true
      }
    })
  ]);

  const unreadCountByUserId = new Map(
    unreadCounts.map((item) => [item.userId, item._count._all])
  );

  const conversations = users
    .map(({ message, _count, ...user }) => ({
      user,
      lastMessage: message[0] ?? null,
      unreadCount: unreadCountByUserId.get(user.id) ?? 0,
      totalMessages: _count.message
    }))
    .sort((left, right) => {
      const leftTime = left.lastMessage ? new Date(left.lastMessage.createdAt).getTime() : 0;
      const rightTime = right.lastMessage ? new Date(right.lastMessage.createdAt).getTime() : 0;

      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }

      return (left.user.name ?? left.user.email).localeCompare(right.user.name ?? right.user.email, "ru");
    });

  return { conversations };
});
