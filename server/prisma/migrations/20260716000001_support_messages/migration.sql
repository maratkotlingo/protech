CREATE TYPE "MessageSenderRole" AS ENUM ('USER', 'ADMIN', 'SYSTEM');

ALTER TYPE "MessageType" ADD VALUE 'SUPPORT';

ALTER TABLE "message"
  ADD COLUMN "sender_role" "MessageSenderRole" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "read_at" TIMESTAMP(3);

CREATE INDEX "message_user_id_created_at_idx" ON "message"("user_id", "createdAt");
CREATE INDEX "message_sender_role_read_at_idx" ON "message"("sender_role", "read_at");
