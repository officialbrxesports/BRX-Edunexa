-- CreateTable
CREATE TABLE "batch_attendance" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "markedBy" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "batch_attendance_institutionId_date_idx" ON "batch_attendance"("institutionId", "date");

-- CreateIndex
CREATE INDEX "batch_attendance_studentId_idx" ON "batch_attendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "batch_attendance_batchId_studentId_date_key" ON "batch_attendance"("batchId", "studentId", "date");

-- AddForeignKey
ALTER TABLE "batch_attendance" ADD CONSTRAINT "batch_attendance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_attendance" ADD CONSTRAINT "batch_attendance_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_attendance" ADD CONSTRAINT "batch_attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
