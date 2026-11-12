-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('CORE', 'OPTIONAL', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('THEORY', 'PRACTICAL', 'BOTH');

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL DEFAULT 'CORE',
    "category" "SubjectCategory" NOT NULL DEFAULT 'BOTH',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subjects" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_teachers" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "teacherId" TEXT NOT NULL,
    "weeklyPeriods" INTEGER NOT NULL DEFAULT 0,
    "theoryPeriods" INTEGER NOT NULL DEFAULT 0,
    "practicalPeriods" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subjects_institutionId_idx" ON "subjects"("institutionId");

-- CreateIndex
CREATE INDEX "subjects_isActive_idx" ON "subjects"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_institutionId_code_key" ON "subjects"("institutionId", "code");

-- CreateIndex
CREATE INDEX "class_subjects_subjectId_idx" ON "class_subjects"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_classId_subjectId_key" ON "class_subjects"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "subject_teachers_institutionId_idx" ON "subject_teachers"("institutionId");

-- CreateIndex
CREATE INDEX "subject_teachers_subjectId_idx" ON "subject_teachers"("subjectId");

-- CreateIndex
CREATE INDEX "subject_teachers_classId_idx" ON "subject_teachers"("classId");

-- CreateIndex
CREATE INDEX "subject_teachers_sectionId_idx" ON "subject_teachers"("sectionId");

-- CreateIndex
CREATE INDEX "subject_teachers_teacherId_idx" ON "subject_teachers"("teacherId");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
