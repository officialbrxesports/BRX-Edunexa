-- CreateTable
CREATE TABLE "program_applications" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "formProfile" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "studentEmail" TEXT,
    "phone" TEXT NOT NULL,
    "fatherName" TEXT,
    "motherName" TEXT,
    "category" TEXT,
    "nationality" TEXT,
    "identityLast4" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "details" JSONB,
    "declarationAccepted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "rejectionReason" TEXT,
    "approvedStudentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_application_documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_application_files" (
    "documentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "program_application_files_pkey" PRIMARY KEY ("documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_applications_applicationNumber_key" ON "program_applications"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "program_applications_approvedStudentId_key" ON "program_applications"("approvedStudentId");

-- CreateIndex
CREATE INDEX "program_applications_institutionId_status_idx" ON "program_applications"("institutionId", "status");

-- CreateIndex
CREATE INDEX "program_applications_institutionId_targetId_idx" ON "program_applications"("institutionId", "targetId");

-- CreateIndex
CREATE INDEX "program_applications_phone_idx" ON "program_applications"("phone");

-- CreateIndex
CREATE INDEX "program_application_documents_applicationId_idx" ON "program_application_documents"("applicationId");

-- AddForeignKey
ALTER TABLE "program_applications" ADD CONSTRAINT "program_applications_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_application_documents" ADD CONSTRAINT "program_application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "program_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_application_files" ADD CONSTRAINT "program_application_files_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "program_application_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
