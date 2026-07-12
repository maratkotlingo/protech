-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RESERVE', 'RELEASE', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "product" ADD COLUMN "cost_price" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "order_item"
ADD COLUMN "cost_price" DECIMAL(12,2),
ADD COLUMN "line_total" DECIMAL(12,2),
ADD COLUMN "product_name" TEXT,
ADD COLUMN "product_article" TEXT,
ADD COLUMN "product_main_image" TEXT,
ADD COLUMN "category_id" INTEGER,
ADD COLUMN "category_name" TEXT;

UPDATE "order_item" AS oi
SET
  "line_total" = oi."price" * oi."quantity",
  "product_name" = p."name",
  "product_article" = p."article",
  "product_main_image" = p."main_image",
  "category_id" = p."category_id",
  "category_name" = c."name",
  "cost_price" = p."cost_price"
FROM "product" AS p
LEFT JOIN "category" AS c ON c."id" = p."category_id"
WHERE p."id" = oi."product_id";

UPDATE "order_item"
SET
  "product_name" = COALESCE("product_name", 'Unknown product'),
  "product_article" = COALESCE("product_article", 'unknown'),
  "line_total" = COALESCE("line_total", "price" * "quantity");

ALTER TABLE "order_item"
ALTER COLUMN "line_total" SET NOT NULL,
ALTER COLUMN "product_name" SET NOT NULL,
ALTER COLUMN "product_article" SET NOT NULL;

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "type" "StockMovementType" NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_item_category_id_idx" ON "order_item"("category_id");

-- CreateIndex
CREATE INDEX "payment_payment_status_paid_at_idx" ON "payment"("payment_status", "paid_at");

-- CreateIndex
CREATE INDEX "payment_paid_at_idx" ON "payment"("paid_at");

-- CreateIndex
CREATE INDEX "stock_movement_product_id_created_at_idx" ON "stock_movement"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movement_order_id_idx" ON "stock_movement"("order_id");

-- CreateIndex
CREATE INDEX "stock_movement_type_created_at_idx" ON "stock_movement"("type", "created_at");

-- CreateIndex
CREATE INDEX "stock_movement_created_at_idx" ON "stock_movement"("created_at");

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
