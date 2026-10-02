-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'ANNOUNCEMENT', 'REMINDER', 'SUCCESS', 'WARNING', 'ALERT');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "senderId" TEXT,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_institutionId_idx" ON "notifications"("institutionId");

-- CreateIndex
CREATE INDEX "notifications_senderId_idx" ON "notifications"("senderId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_institutionId_recipientId_isRead_idx" ON "notifications"("institutionId", "recipientId", "isRead");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
