/*
  Warnings:

  - You are about to drop the column `jobId` on the `Execution` table. All the data in the column will be lost.
  - You are about to drop the column `memoryUsedKb` on the `Execution` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `pinned` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `replyToId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `inviteCode` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FileSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RolePermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomSetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Snapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "ExecStatus" ADD VALUE 'TIMEOUT';

-- DropForeignKey
ALTER TABLE "public"."File" DROP CONSTRAINT "File_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FileSnapshot" DROP CONSTRAINT "FileSnapshot_fileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FileSnapshot" DROP CONSTRAINT "FileSnapshot_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invite" DROP CONSTRAINT "Invite_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reaction" DROP CONSTRAINT "Reaction_messageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reaction" DROP CONSTRAINT "Reaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Role" DROP CONSTRAINT "Role_parentRoleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoomAnalytics" DROP CONSTRAINT "RoomAnalytics_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoomSetting" DROP CONSTRAINT "RoomSetting_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Snapshot" DROP CONSTRAINT "Snapshot_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserActivityLog" DROP CONSTRAINT "UserActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserPreferences" DROP CONSTRAINT "UserPreferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropIndex
DROP INDEX "public"."Room_inviteCode_key";

-- AlterTable
ALTER TABLE "Execution" DROP COLUMN "jobId",
DROP COLUMN "memoryUsedKb";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "deletedAt",
DROP COLUMN "pinned",
DROP COLUMN "replyToId";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "deletedAt",
DROP COLUMN "inviteCode",
ADD COLUMN     "lastKnownCode" TEXT DEFAULT '',
ADD COLUMN     "lastKnownInput" TEXT DEFAULT '',
ADD COLUMN     "lastKnownOutput" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "plan",
DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'Developer';

-- DropTable
DROP TABLE "public"."File";

-- DropTable
DROP TABLE "public"."FileSnapshot";

-- DropTable
DROP TABLE "public"."Invite";

-- DropTable
DROP TABLE "public"."Notification";

-- DropTable
DROP TABLE "public"."PaymentTransaction";

-- DropTable
DROP TABLE "public"."Permission";

-- DropTable
DROP TABLE "public"."Reaction";

-- DropTable
DROP TABLE "public"."Role";

-- DropTable
DROP TABLE "public"."RolePermission";

-- DropTable
DROP TABLE "public"."RoomAnalytics";

-- DropTable
DROP TABLE "public"."RoomSetting";

-- DropTable
DROP TABLE "public"."Snapshot";

-- DropTable
DROP TABLE "public"."Subscription";

-- DropTable
DROP TABLE "public"."UserActivityLog";

-- DropTable
DROP TABLE "public"."UserPreferences";

-- DropTable
DROP TABLE "public"."UserRole";

-- DropEnum
DROP TYPE "public"."BillingStatus";

-- DropEnum
DROP TYPE "public"."NotificationType";

-- DropEnum
DROP TYPE "public"."PaymentStatus";

-- DropEnum
DROP TYPE "public"."PlanType";
