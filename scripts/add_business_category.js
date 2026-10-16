import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    await client.query("ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS business_category VARCHAR(50) DEFAULT 'restaurant';");
    console.log("Column 'business_category' added successfully!");
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

run();
