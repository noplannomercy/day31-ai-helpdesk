import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Next.js automatically loads .env.local in development
// No need for dotenv in runtime (only needed for drizzle-kit CLI)
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;

// Disable prefetch for better compatibility
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
