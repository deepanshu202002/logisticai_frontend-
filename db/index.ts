// Database initialization for LogisticAI
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing! Check your Vercel Environment Variables.");
}

// Use a more robust connection for Vercel/Serverless environments
export const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'allow', // Allows SSL connections required by many cloud DBs
  max: 1        // Limit connections per serverless function instance
});
export const db = drizzle(client, { schema });
