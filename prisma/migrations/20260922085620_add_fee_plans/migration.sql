-- CreateEnum
CREATE TYPE "FeeFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LateFeeType" AS ENUM ('NONE', 'FIXED', 'DAILY', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "fee_plans" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "FeeFrequency" NOT NULL,
    "customDays" INTEGER,
    "dueDay" INTEGER,
    "lateFeeType" "LateFeeType" NOT NULL DEFAULT 'NONE',
    "lateFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAllowed" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_plans_institutionId_idx" ON "fee_plans"("institutionId");

-- CreateIndex
CREATE INDEX "fee_plans_classId_idx" ON "fee_plans"("classId");

-- CreateIndex
CREATE INDEX "fee_plans_sectionId_idx" ON "fee_plans"("sectionId");

-- CreateIndex
CREATE INDEX "fee_plans_frequency_idx" ON "fee_plans"("frequency");

-- CreateIndex
CREATE INDEX "fee_plans_isActive_idx" ON "fee_plans"("isActive");

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
