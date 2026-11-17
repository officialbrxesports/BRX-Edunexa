-- CreateTable
CREATE TABLE "AdmissionDocumentFile" (
    "documentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "AdmissionDocumentFile_pkey" PRIMARY KEY ("documentId")
);

-- AddForeignKey
ALTER TABLE "AdmissionDocumentFile" ADD CONSTRAINT "AdmissionDocumentFile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AdmissionDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
