require("dotenv").config({ path: "apps/api/.env" });
const { Client } = require("pg");

async function main() {
  if (!process.env.DIRECT_URL) {
    throw new Error("DIRECT_URL is missing.");
  }

  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();

    const columns = await client.query(`
      SELECT table_name, column_name, is_nullable, column_default, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN (
          'institutions',
          'users',
          'registration_sessions',
          'registration_otp_verifications'
        )
      ORDER BY table_name, ordinal_position
    `);

    console.log("\nDATABASE COLUMNS");
    console.table(columns.rows);

    const enums = await client.query(`
      SELECT t.typname AS enum_name, e.enumlabel AS enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      ORDER BY t.typname, e.enumsortorder
    `);

    console.log("\nENUM VALUES");
    console.table(enums.rows);

    const keys = await client.query(`
      SELECT tc.table_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name IN ('institutions', 'users')
      ORDER BY tc.table_name, tc.constraint_type, kcu.column_name
    `);

    console.log("\nKEY CONSTRAINTS");
    console.table(keys.rows);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error("Inspection failed:", error.message);
  process.exitCode = 1;
});
