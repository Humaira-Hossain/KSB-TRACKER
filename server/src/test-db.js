import { pool } from "./db.js";

try {
  const result = await pool.query(`
    SELECT code, type
    FROM ksbs
    ORDER BY code;
  `);

  console.log("✅ Connected to Supabase PostgreSQL!");
  console.table(result.rows);
} catch (error) {
  console.error("❌ Database connection failed:");
  console.error(error);
} finally {
  await pool.end();
}