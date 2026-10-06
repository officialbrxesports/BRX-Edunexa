/*
  Warnings:

  - The values [PRIVATE_SCHOOL] on the enum `InstitutionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InstitutionType_new" AS ENUM ('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'COACHING', 'INSTITUTE', 'OTHER');
ALTER TABLE "institutions" ALTER COLUMN "type" TYPE "InstitutionType_new" USING ("type"::text::"InstitutionType_new");
ALTER TABLE "registration_sessions" ALTER COLUMN "institutionType" TYPE "InstitutionType_new" USING ("institutionType"::text::"InstitutionType_new");
ALTER TYPE "InstitutionType" RENAME TO "InstitutionType_old";
ALTER TYPE "InstitutionType_new" RENAME TO "InstitutionType";
DROP TYPE "public"."InstitutionType_old";
COMMIT;
