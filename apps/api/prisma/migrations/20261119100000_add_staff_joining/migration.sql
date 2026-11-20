-- CreateTable
CREATE TABLE "staff_applications" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fatherName" TEXT,
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
    "createdUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_application_documents" (
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

    CONSTRAINT "staff_application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_application_files" (
    "documentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "staff_application_files_pkey" PRIMARY KEY ("documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_applications_applicationNumber_key" ON "staff_applications"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "staff_applications_createdUserId_key" ON "staff_applications"("createdUserId");

-- CreateIndex
CREATE INDEX "staff_applications_institutionId_status_idx" ON "staff_applications"("institutionId", "status");

-- CreateIndex
CREATE INDEX "staff_applications_institutionId_role_idx" ON "staff_applications"("institutionId", "role");

-- CreateIndex
CREATE INDEX "staff_applications_email_idx" ON "staff_applications"("email");

-- CreateIndex
CREATE INDEX "staff_application_documents_applicationId_idx" ON "staff_application_documents"("applicationId");

-- AddForeignKey
ALTER TABLE "staff_applications" ADD CONSTRAINT "staff_applications_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_application_documents" ADD CONSTRAINT "staff_application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "staff_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_application_files" ADD CONSTRAINT "staff_application_files_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "staff_application_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
