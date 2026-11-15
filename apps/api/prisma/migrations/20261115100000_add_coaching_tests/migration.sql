-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "subject" VARCHAR(80),
    "testDate" TIMESTAMP(3) NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marks" DOUBLE PRECISION,
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tests_institutionId_batchId_idx" ON "tests"("institutionId", "batchId");

-- CreateIndex
CREATE INDEX "tests_batchId_testDate_idx" ON "tests"("batchId", "testDate");

-- CreateIndex
CREATE INDEX "test_results_institutionId_idx" ON "test_results"("institutionId");

-- CreateIndex
CREATE INDEX "test_results_studentId_idx" ON "test_results"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_testId_studentId_key" ON "test_results"("testId", "studentId");

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
