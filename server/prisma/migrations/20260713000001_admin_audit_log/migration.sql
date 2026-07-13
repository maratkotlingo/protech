CREATE TYPE "AuditAction" AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'BULK_UPDATE',
  'BULK_DELETE',
  'STOCK_ADJUSTMENT',
  'ANSWER',
  'ORDER_STATUS',
  'PAYMENT_STATUS',
  'LOGIN',
  'LOGOUT'
);

CREATE TABLE "audit_log" (
  "id" SERIAL NOT NULL,
  "admin_id" TEXT,
  "action" "AuditAction" NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_admin_id_created_at_idx" ON "audit_log"("admin_id", "created_at");
CREATE INDEX "audit_log_entity_type_created_at_idx" ON "audit_log"("entity_type", "created_at");
CREATE INDEX "audit_log_action_created_at_idx" ON "audit_log"("action", "created_at");

ALTER TABLE "audit_log"
ADD CONSTRAINT "audit_log_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
