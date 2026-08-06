import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://mock:mock@localhost:5432/mock',
});

// If DATABASE_URL is not provided, this pool will likely fail to connect.
// We handle this gracefully in our API layer by catching DB errors.
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });

// Helper to check if DB is configured
export const isDbConfigured = () => !!process.env.DATABASE_URL;
