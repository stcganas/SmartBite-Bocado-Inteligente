import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set!");
    return;
  }
  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log("Connected to database. Executing query...");
    const res = await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS points_multiplier INTEGER DEFAULT 1;
    `);
    console.log("Success! Table altered of products.");
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

run();
