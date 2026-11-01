require("dotenv").config();

const { Pool } = require("pg");
const argon2 = require("argon2");
const readline = require("readline");

async function main() {
  const email = "brx-test-51d2fa6c@example.com";
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const password = await new Promise(resolve => {
    rl.question("Enter new HEAD password (12+ characters): ", answer => {
      rl.close();
      resolve(answer);
    });
  });

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  try {
    const hash = await argon2.hash(password);

    const result = await pool.query(
      `UPDATE "users"
       SET "passwordHash" = $1, "updatedAt" = CURRENT_TIMESTAMP
       WHERE LOWER("email") = $2
         AND "role"::text = 'HEAD'
         AND "status"::text = 'ACTIVE'
       RETURNING "email"`,
      [hash, email]
    );

    if (result.rowCount !== 1) {
      throw new Error("Exactly one active HEAD account was not found.");
    }

    console.log("HEAD password reset successfully.");
    console.log("Email:", result.rows[0].email);
  } finally {
    rl.close();
    await pool.end();
  }
}

main().catch(error => {
  console.error("Reset failed:", error.message);
  process.exitCode = 1;
});
