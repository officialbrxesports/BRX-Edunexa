require("dotenv").config();

const { Pool } = require("pg");
const argon2 = require("argon2");

async function main() {
  const { DATABASE_URL, PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD } = process.env;

  if (!DATABASE_URL || !PLATFORM_ADMIN_EMAIL || !PLATFORM_ADMIN_PASSWORD) {
    throw new Error("Required environment variables are missing.");
  }

  if (PLATFORM_ADMIN_PASSWORD.length < 12) {
    throw new Error("Password must contain at least 12 characters.");
  }

  const email = PLATFORM_ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await argon2.hash(PLATFORM_ADMIN_PASSWORD);
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const result = await pool.query(
      `UPDATE "users"
       SET "passwordHash" = $1, "updatedAt" = CURRENT_TIMESTAMP
       WHERE LOWER("email") = $2
         AND "role"::text = 'PLATFORM_ADMIN'
         AND "status"::text = 'ACTIVE'
       RETURNING "email", "brxUid"`,
      [passwordHash, email]
    );

    if (result.rowCount !== 1) {
      throw new Error("Exactly one active Platform Admin was not found. No account changed.");
    }

    console.log("Platform Admin password reset successfully.");
    console.log("Email:", result.rows[0].email);
    console.log("BRX UID:", result.rows[0].brxUid);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
});
