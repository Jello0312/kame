-- CreateEnum
CREATE TYPE "subscription_tier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "body_shape" AS ENUM ('HOURGLASS', 'PEAR', 'APPLE', 'RECTANGLE', 'INVERTED_TRIANGLE');

-- CreateEnum
CREATE TYPE "measurement_unit" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "avatar_status" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "budget_range" AS ENUM ('BUDGET', 'MID', 'PREMIUM', 'LUXURY');

-- CreateEnum
CREATE TYPE "platform" AS ENUM ('AMAZON', 'SHEIN', 'ZARA', 'ZALORA', 'ZALANDO', 'TAOBAO', 'ASOS');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'UNISEX');

-- CreateEnum
CREATE TYPE "try_on_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "swipe_action_type" AS ENUM ('LIKE', 'DISLIKE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subscription_tier" "subscription_tier" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gender" TEXT NOT NULL,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "waist_cm" DOUBLE PRECISION,
    "body_shape" "body_shape",
    "measurement_unit" "measurement_unit" NOT NULL DEFAULT 'METRIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_avatars" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "face_photo_url" TEXT,
    "body_photo_url" TEXT,
    "status" "avatar_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_avatars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "budget_range" "budget_range" NOT NULL DEFAULT 'MID',
    "fashion_styles" TEXT[],
    "preferred_platforms" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "platform" "platform" NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "image_urls" TEXT[],
    "product_page_url" TEXT NOT NULL,
    "affiliate_url" TEXT,
    "category" TEXT NOT NULL,
    "fashn_category" TEXT,
    "available_sizes" TEXT[],
    "style_tags" TEXT[],
    "gender" "gender" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_pairings" (
    "id" UUID NOT NULL,
    "top_product_id" UUID NOT NULL,
    "bottom_product_id" UUID NOT NULL,
    "gender" TEXT NOT NULL,
    "style_tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outfit_pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "try_on_results" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID,
    "outfit_pairing_id" UUID,
    "result_image_url" TEXT,
    "status" "try_on_status" NOT NULL DEFAULT 'PENDING',
    "layer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "try_on_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swipe_actions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "action" "swipe_action_type" NOT NULL,
    "outfit_group_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipe_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_avatars_user_id_key" ON "user_avatars"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "style_preferences_user_id_key" ON "style_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_external_id_platform_key" ON "products"("external_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "swipe_actions_user_id_product_id_key" ON "swipe_actions"("user_id", "product_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_preferences" ADD CONSTRAINT "style_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_pairings" ADD CONSTRAINT "outfit_pairings_top_product_id_fkey" FOREIGN KEY ("top_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_pairings" ADD CONSTRAINT "outfit_pairings_bottom_product_id_fkey" FOREIGN KEY ("bottom_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_results" ADD CONSTRAINT "try_on_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_results" ADD CONSTRAINT "try_on_results_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_results" ADD CONSTRAINT "try_on_results_outfit_pairing_id_fkey" FOREIGN KEY ("outfit_pairing_id") REFERENCES "outfit_pairings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipe_actions" ADD CONSTRAINT "swipe_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipe_actions" ADD CONSTRAINT "swipe_actions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
