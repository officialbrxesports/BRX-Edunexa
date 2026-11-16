// Creates the FIRST Platform Admin on an empty database. It never changes an
// existing account and never prints the password.
//
// PowerShell (values only live in this one command):
//   $env:DIRECT_URL="..."; $env:PLATFORM_ADMIN_EMAIL="you@example.com";
//   $env:PLATFORM_ADMIN_PASSWORD="a-long-password"; node scripts/seed-platform-admin.cjs
require("dotenv").config();

const { randomUUID } = require("node:crypto");
const { Pool } = require("pg");
const argon2 = require("argon2");

async function main() {
  const { DIRECT_URL, PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD } = process.env;

  if (!DIRECT_URL || !PLATFORM_ADMIN_EMAIL || !PLATFORM_ADMIN_PASSWORD) {
    throw new Error("DIRECT_URL, PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD are required.");
  }

  if (PLATFORM_ADMIN_PASSWORD.length < 12) {
    throw new Error("Password must contain at least 12 characters.");
  }

  const email = PLATFORM_ADMIN_EMAIL.trim().toLowerCase();
  const pool = new Pool({ connectionString: DIRECT_URL });

  try {
    const existing = await pool.query(
      `SELECT 1 FROM "users" WHERE "role"::text = 'PLATFORM_ADMIN' LIMIT 1`,
    );

    if (existing.rowCount > 0) {
      console.log("A Platform Admin already exists. Nothing was changed.");
      return;
    }

    const passwordHash = await argon2.hash(PLATFORM_ADMIN_PASSWORD);
    const brxUid = `BRX-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    await pool.query(
      `INSERT INTO "users"
         ("id", "email", "passwordHash", "firstName", "lastName", "role", "status", "brxUid", "updatedAt")
       VALUES ($1, $2, $3, 'Platform', 'Admin', 'PLATFORM_ADMIN', 'ACTIVE', $4, CURRENT_TIMESTAMP)`,
      [randomUUID(), email, passwordHash, brxUid],
    );

    console.log("Platform Admin created.");
    console.log("Email:", email);
    console.log("BRX UID:", brxUid);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
});
