ALTER TABLE "users"
ADD COLUMN "brxUid" VARCHAR(32);

UPDATE "users"
SET "brxUid" = 'BRX-' || SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 12)
WHERE "brxUid" IS NULL;

ALTER TABLE "users"
ALTER COLUMN "brxUid" SET NOT NULL;

CREATE UNIQUE INDEX "users_brxUid_key"
ON "users"("brxUid");