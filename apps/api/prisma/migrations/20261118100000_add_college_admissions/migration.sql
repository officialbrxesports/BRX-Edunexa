-- CreateTable
CREATE TABLE "college_applications" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
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

    CONSTRAINT "college_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_application_documents" (
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

    CONSTRAINT "college_application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_application_files" (
    "documentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "college_application_files_pkey" PRIMARY KEY ("documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "college_applications_applicationNumber_key" ON "college_applications"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "college_applications_approvedStudentId_key" ON "college_applications"("approvedStudentId");

-- CreateIndex
CREATE INDEX "college_applications_institutionId_status_idx" ON "college_applications"("institutionId", "status");

-- CreateIndex
CREATE INDEX "college_applications_programId_idx" ON "college_applications"("programId");

-- CreateIndex
CREATE INDEX "college_applications_phone_idx" ON "college_applications"("phone");

-- CreateIndex
CREATE INDEX "college_application_documents_applicationId_idx" ON "college_application_documents"("applicationId");

-- AddForeignKey
ALTER TABLE "college_applications" ADD CONSTRAINT "college_applications_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_applications" ADD CONSTRAINT "college_applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_application_documents" ADD CONSTRAINT "college_application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "college_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_application_files" ADD CONSTRAINT "college_application_files_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "college_application_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
