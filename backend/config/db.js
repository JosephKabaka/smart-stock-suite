import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

// We use the full connection string from your .env file
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // This is required for Supabase/Cloud connections
  },
});

// Adding a simple error listener to catch connection issues
db.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
  process.exit(-1);
});

export default db;
