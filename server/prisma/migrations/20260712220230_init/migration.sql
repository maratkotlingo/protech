-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('DELIVERY', 'STOCK', 'PRICE', 'FAQ_ANSWER', 'REVIEW_ANSWER');

-- CreateEnum
CREATE TYPE "ObtainingMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('OZON');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'UPON_RECEIPT', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "scope" TEXT,
    "password" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_question" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "is_answered" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_question_image" (
    "id" SERIAL NOT NULL,
    "shop_question_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "shop_question_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_answer" (
    "id" SERIAL NOT NULL,
    "shop_question_id" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "obtaining_method" "ObtainingMethod" NOT NULL,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "payment_method" "PaymentMethod" NOT NULL,
    "stock_reserved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "apartment" TEXT,
    "entrance" TEXT,
    "floor" TEXT,
    "intercom" TEXT,
    "comment" TEXT,
    "delivery_method" "DeliveryMethod" NOT NULL DEFAULT 'OZON',
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transaction_id" TEXT,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "current_price" DECIMAL(12,2) NOT NULL,
    "old_price" DECIMAL(12,2),
    "article" TEXT NOT NULL,
    "main_image" TEXT NOT NULL,
    "ozon_link" TEXT,
    "category_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "product_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_stock" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "attribute_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "product_attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_subscription" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_product" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "advantages" TEXT,
    "disadvantages" TEXT,
    "comment" TEXT,
    "is_answered" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_photo" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "review_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_answer" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "cart_user_id_key" ON "cart"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_item_cart_id_product_id_key" ON "cart_item"("cart_id", "product_id");

-- CreateIndex
CREATE INDEX "shop_question_user_id_idx" ON "shop_question"("user_id");

-- CreateIndex
CREATE INDEX "shop_question_image_shop_question_id_idx" ON "shop_question_image"("shop_question_id");

-- CreateIndex
CREATE INDEX "shop_answer_shop_question_id_idx" ON "shop_answer"("shop_question_id");

-- CreateIndex
CREATE INDEX "order_user_id_idx" ON "order"("user_id");

-- CreateIndex
CREATE INDEX "order_order_status_created_at_idx" ON "order"("order_status", "created_at");

-- CreateIndex
CREATE INDEX "order_created_at_idx" ON "order"("created_at");

-- CreateIndex
CREATE INDEX "order_item_product_id_idx" ON "order_item"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_order_id_product_id_key" ON "order_item"("order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_order_id_key" ON "delivery"("order_id");

-- CreateIndex
CREATE INDEX "delivery_order_id_idx" ON "delivery"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_order_id_key" ON "payment"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transaction_id_key" ON "payment"("transaction_id");

-- CreateIndex
CREATE INDEX "payment_order_id_idx" ON "payment"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_article_key" ON "product"("article");

-- CreateIndex
CREATE INDEX "product_category_id_is_active_idx" ON "product"("category_id", "is_active");

-- CreateIndex
CREATE INDEX "product_image_product_id_idx" ON "product_image"("product_id");

-- CreateIndex
CREATE INDEX "product_price_product_id_created_at_idx" ON "product_price"("product_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "product_stock_product_id_key" ON "product_stock"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_name_unit_key" ON "attribute"("name", "unit");

-- CreateIndex
CREATE INDEX "product_attribute_attribute_id_value_idx" ON "product_attribute"("attribute_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_product_id_attribute_id_key" ON "product_attribute"("product_id", "attribute_id");

-- CreateIndex
CREATE INDEX "product_subscription_product_id_idx" ON "product_subscription"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_subscription_user_id_product_id_key" ON "product_subscription"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "favorite_product_product_id_idx" ON "favorite_product"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_product_user_id_product_id_key" ON "favorite_product"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "review_product_id_idx" ON "review"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_user_id_product_id_key" ON "review"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "review_photo_review_id_idx" ON "review_photo"("review_id");

-- CreateIndex
CREATE INDEX "review_answer_review_id_idx" ON "review_answer"("review_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_question" ADD CONSTRAINT "shop_question_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_question_image" ADD CONSTRAINT "shop_question_image_shop_question_id_fkey" FOREIGN KEY ("shop_question_id") REFERENCES "shop_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_answer" ADD CONSTRAINT "shop_answer_shop_question_id_fkey" FOREIGN KEY ("shop_question_id") REFERENCES "shop_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_answer" ADD CONSTRAINT "shop_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price" ADD CONSTRAINT "product_price_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute" ADD CONSTRAINT "product_attribute_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute" ADD CONSTRAINT "product_attribute_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subscription" ADD CONSTRAINT "product_subscription_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subscription" ADD CONSTRAINT "product_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_product" ADD CONSTRAINT "favorite_product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_product" ADD CONSTRAINT "favorite_product_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_photo" ADD CONSTRAINT "review_photo_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_answer" ADD CONSTRAINT "review_answer_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_answer" ADD CONSTRAINT "review_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
