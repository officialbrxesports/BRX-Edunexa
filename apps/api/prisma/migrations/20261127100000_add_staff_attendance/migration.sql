-- CreateTable
CREATE TABLE IF NOT EXISTS "staff_attendance" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "staff_attendance_userId_date_key" ON "staff_attendance"("userId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "staff_attendance_institutionId_date_idx" ON "staff_attendance"("institutionId", "date");
