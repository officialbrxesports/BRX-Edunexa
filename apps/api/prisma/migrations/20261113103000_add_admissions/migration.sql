-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ENROLLED');

-- CreateEnum
CREATE TYPE "AdmissionDocumentType" AS ENUM ('STUDENT_PHOTO', 'BIRTH_CERTIFICATE', 'IDENTITY_DOCUMENT', 'TRANSFER_CERTIFICATE', 'MARKSHEET', 'OTHER');

-- CreateEnum
CREATE TYPE "AdmissionPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "studentEmail" TEXT,
    "gender" "Gender",
    "bloodGroup" TEXT,
    "category" TEXT,
    "religion" TEXT,
    "motherTongue" TEXT,
    "identityLast4" TEXT,
    "fatherName" TEXT,
    "fatherOccupation" TEXT,
    "motherName" TEXT,
    "motherOccupation" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "parentPhone" TEXT NOT NULL,
    "whatsappPhone" TEXT,
    "parentEmail" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "previousBoard" TEXT,
    "previousMarks" TEXT,
    "previousTCNumber" TEXT,
    "declarationAccepted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "rejectionReason" TEXT,
    "approvedStudentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "AdmissionDocumentType" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "transactionId" TEXT,
    "paymentStatus" "AdmissionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "note" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "oldStatus" "AdmissionStatus",
    "newStatus" "AdmissionStatus" NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_applicationNumber_key" ON "AdmissionApplication"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_approvedStudentId_key" ON "AdmissionApplication"("approvedStudentId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_institutionId_status_idx" ON "AdmissionApplication"("institutionId", "status");

-- CreateIndex
CREATE INDEX "AdmissionApplication_classId_sectionId_idx" ON "AdmissionApplication"("classId", "sectionId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_parentPhone_idx" ON "AdmissionApplication"("parentPhone");

-- CreateIndex
CREATE INDEX "AdmissionApplication_createdAt_idx" ON "AdmissionApplication"("createdAt");

-- CreateIndex
CREATE INDEX "AdmissionApplication_approvedStudentId_idx" ON "AdmissionApplication"("approvedStudentId");

-- CreateIndex
CREATE INDEX "AdmissionDocument_applicationId_idx" ON "AdmissionDocument"("applicationId");

-- CreateIndex
CREATE INDEX "AdmissionDocument_type_idx" ON "AdmissionDocument"("type");

-- CreateIndex
CREATE INDEX "AdmissionDocument_verified_idx" ON "AdmissionDocument"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionReceipt_receiptNumber_key" ON "AdmissionReceipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionReceipt_applicationId_key" ON "AdmissionReceipt"("applicationId");

-- CreateIndex
CREATE INDEX "AdmissionReceipt_paymentStatus_idx" ON "AdmissionReceipt"("paymentStatus");

-- CreateIndex
CREATE INDEX "AdmissionReceipt_issuedAt_idx" ON "AdmissionReceipt"("issuedAt");

-- CreateIndex
CREATE INDEX "AdmissionStatusHistory_applicationId_createdAt_idx" ON "AdmissionStatusHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "AdmissionStatusHistory_newStatus_idx" ON "AdmissionStatusHistory"("newStatus");

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_approvedStudentId_fkey" FOREIGN KEY ("approvedStudentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionDocument" ADD CONSTRAINT "AdmissionDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionReceipt" ADD CONSTRAINT "AdmissionReceipt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionStatusHistory" ADD CONSTRAINT "AdmissionStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

