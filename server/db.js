import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add it to a .env file in the server root, e.g'
  );
}

// neon() returns a tagged-template query function for one-shot HTTP queries -
// the right tool for a normal Express request/response cycle.
// Use the "-pooler" connection string from the Neon console here.
export const sql = neon(process.env.DATABASE_URL);