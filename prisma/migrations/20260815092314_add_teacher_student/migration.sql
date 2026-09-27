-- CreateTable
CREATE TABLE "teacher_students" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_students_teacherId_idx" ON "teacher_students"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_students_studentId_idx" ON "teacher_students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_students_teacherId_studentId_key" ON "teacher_students"("teacherId", "studentId");

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
