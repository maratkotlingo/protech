import { AuditAction, type Prisma } from "@prisma/client";

const auditActions = Object.values(AuditAction);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = getPageQueryParam(query.page);
  const limit = 20;
  const action = typeof query.action === "string" && auditActions.includes(query.action as AuditAction)
    ? query.action as AuditAction
    : undefined;
  const entityType = typeof query.entityType === "string" ? query.entityType.trim() : "";
  const search = typeof query.search === "string" ? query.search.trim() : "";

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(search
      ? {
        OR: [
          { summary: { contains: search, mode: "insensitive" } },
          { entityType: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
          { admin: { email: { contains: search, mode: "insensitive" } } }
        ]
      }
      : {})
  };

  const [items, total, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        }
      }
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" }
    })
  ]);

  return {
    items,
    filters: {
      actions: auditActions,
      entityTypes: entityTypes.map((item) => item.entityType)
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
});
