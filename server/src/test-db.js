import pg from "pg";
import "dotenv/config";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();
  console.log("✅ Connected to Supabase PostgreSQL!");

  const result = await client.query("SELECT NOW()");
  console.log("Database time:", result.rows[0].now);

  await client.end();
} catch (error) {
  console.error("❌ Database connection failed:");
  console.error(error);
}