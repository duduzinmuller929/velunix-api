/*
  Warnings:

  - The `freePlan` column on the `affiliates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `affiliates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `coupons` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `provider` on the `emails` table. All the data in the column will be lost.
  - The `status` column on the `emails` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gateway` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `name` column on the `plans` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `language` column on the `profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `theme` column on the `profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `ai_mode` on the `user_settings` table. All the data in the column will be lost.
  - The `theme` column on the `user_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `language` column on the `user_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `cpfCnpj` on the `users` table. All the data in the column will be lost.
  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `action` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `design` to the `emails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `from` to the `emails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `html` to the `emails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to` to the `emails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `emails` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `provider` on the `integrations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `organization_members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `timezone` on the `profiles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timezone` to the `user_sessions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `timezone` on the `user_settings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED', 'DELETED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'MANAGER', 'MODERATOR', 'SUPPORT', 'CEO');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('LOCAL', 'GOOGLE', 'GITHUB', 'DISCORD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'PT', 'ES', 'FR', 'DE', 'IT', 'JA', 'KO', 'ZH', 'AR', 'HI', 'BN');

-- CreateEnum
CREATE TYPE "Timezone" AS ENUM ('UTC', 'GMT', 'CET', 'EST');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AiMode" AS ENUM ('GENERATIVE', 'STREAMING');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE', 'GITHUB', 'DISCORD', 'NOTION', 'SLACK', 'GMAIL', 'WORD', 'EXCEL', 'SPOTIFY', 'FIGMA', 'CANVA', 'TELEGRAM', 'GAMMA');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "AuditLogStatus" AS ENUM ('SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DISABLED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'IN_APP', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'READ', 'UNREAD');

-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('UPLOADING', 'COMPLETED', 'FAILED', 'DELETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('ASAAS', 'STRIPE', 'MERCADO_PAGO', 'PAYPAL');

-- AlterTable
ALTER TABLE "affiliates" DROP COLUMN "freePlan",
ADD COLUMN     "freePlan" "PlanName" NOT NULL DEFAULT 'PRO',
DROP COLUMN "status",
ADD COLUMN     "status" "AffiliateStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "status" "AuditLogStatus" NOT NULL DEFAULT 'SUCCESS',
DROP COLUMN "action",
ADD COLUMN     "action" "AuditLogAction" NOT NULL;

-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "type",
ADD COLUMN     "type" "CouponType" NOT NULL DEFAULT 'PERCENTAGE';

-- AlterTable
ALTER TABLE "emails" DROP COLUMN "provider",
ADD COLUMN     "bcc" TEXT,
ADD COLUMN     "cc" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "design" JSONB NOT NULL,
ADD COLUMN     "from" TEXT NOT NULL,
ADD COLUMN     "html" TEXT NOT NULL,
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "scheduled_at" TIMESTAMP(3),
ADD COLUMN     "to" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EmailStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "integration_tokens" ADD COLUMN     "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "integrations" DROP COLUMN "provider",
ADD COLUMN     "provider" "IntegrationProvider" NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "organization_members" DROP COLUMN "role",
ADD COLUMN     "role" "OrganizationRole" NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "gateway",
ADD COLUMN     "gateway" "PaymentGateway" NOT NULL DEFAULT 'ASAAS',
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "name",
ADD COLUMN     "name" "PlanName" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'EN',
DROP COLUMN "timezone",
ADD COLUMN     "timezone" "Timezone" NOT NULL,
DROP COLUMN "theme",
ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'SYSTEM';

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "name",
ADD COLUMN     "name" "UserRole" NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "priority",
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
DROP COLUMN "status",
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "uploads" ADD COLUMN     "status" "UploadStatus" NOT NULL DEFAULT 'UPLOADING',
ADD COLUMN     "type" "UploadType" NOT NULL;

-- AlterTable
ALTER TABLE "user_sessions" DROP COLUMN "timezone",
ADD COLUMN     "timezone" "Timezone" NOT NULL;

-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "ai_mode",
ADD COLUMN     "aiMode" "AiMode" NOT NULL DEFAULT 'GENERATIVE',
DROP COLUMN "theme",
ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'EN',
DROP COLUMN "timezone",
ADD COLUMN     "timezone" "Timezone" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "cpfCnpj",
ADD COLUMN     "provider" "Provider" NOT NULL DEFAULT 'LOCAL',
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "email_attachments" (
    "id" TEXT NOT NULL,
    "email_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,

    CONSTRAINT "email_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- AddForeignKey
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
