import { AuditAction } from "@prisma/client";
import { bulkFaqSchema } from "~~/shared/schemas/admin/faq/bulkFaq";

const faqBulkSummary: Record<string, string> = {
  delete: "Bulk deleted FAQ questions",
  markAnswered: "Bulk marked FAQ questions as answered",
  markUnanswered: "Bulk marked FAQ questions as unanswered"
};

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);
  const body = await validateBody(event, bulkFaqSchema);

  const result = body.action === "delete"
    ? await prisma.shopQuestion.deleteMany({
      where: { id: { in: body.shopQuestionIds } }
    })
    : await prisma.shopQuestion.updateMany({
      where: { id: { in: body.shopQuestionIds } },
      data: { isAnswered: body.action === "markAnswered" }
    });

  await recordAdminAudit({
    adminId: userId,
    action: body.action === "delete" ? AuditAction.BULK_DELETE : AuditAction.BULK_UPDATE,
    entityType: "shop_question",
    summary: faqBulkSummary[body.action] ?? "Bulk FAQ operation",
    metadata: {
      shopQuestionIds: body.shopQuestionIds,
      action: body.action,
      affected: result.count
    }
  });

  return { success: true, count: result.count };
});
