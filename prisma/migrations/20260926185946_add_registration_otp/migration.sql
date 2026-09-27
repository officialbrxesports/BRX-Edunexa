-- CreateEnum
CREATE TYPE "RegistrationVerificationType" AS ENUM ('MOBILE', 'EMAIL');

-- CreateTable
CREATE TABLE "registration_sessions" (
    "id" TEXT NOT NULL,
    "institutionType" "InstitutionType" NOT NULL,
    "institutionName" TEXT NOT NULL,
    "institutionEmail" TEXT NOT NULL,
    "institutionPhone" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "website" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "ownerEmail" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "establishedYear" INTEGER,
    "registrationNumber" TEXT,
    "gstin" TEXT,
    "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_otp_verifications" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "RegistrationVerificationType" NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registration_sessions_institutionEmail_idx" ON "registration_sessions"("institutionEmail");

-- CreateIndex
CREATE INDEX "registration_sessions_institutionPhone_idx" ON "registration_sessions"("institutionPhone");

-- CreateIndex
CREATE INDEX "registration_sessions_ownerEmail_idx" ON "registration_sessions"("ownerEmail");

-- CreateIndex
CREATE INDEX "registration_sessions_expiresAt_idx" ON "registration_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "registration_otp_verifications_sessionId_idx" ON "registration_otp_verifications"("sessionId");

-- CreateIndex
CREATE INDEX "registration_otp_verifications_type_idx" ON "registration_otp_verifications"("type");

-- CreateIndex
CREATE INDEX "registration_otp_verifications_expiresAt_idx" ON "registration_otp_verifications"("expiresAt");

-- AddForeignKey
ALTER TABLE "registration_otp_verifications" ADD CONSTRAINT "registration_otp_verifications_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "registration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
