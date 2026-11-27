-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "note_sends" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "documentId" TEXT,
    "title" VARCHAR(160) NOT NULL,
    "audience" VARCHAR(20) NOT NULL,
    "classId" TEXT,
    "sectionId" TEXT,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "emailed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_sends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "note_sends_institutionId_createdAt_idx" ON "note_sends"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "note_sends_senderId_idx" ON "note_sends"("senderId");
