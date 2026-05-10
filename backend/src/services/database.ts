import { Pool, QueryResult } from 'pg';

let pool: Pool;

export async function initDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL || 'postgresql://nexus:nexus@localhost:5432/nexusarena';

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err);
  });

  try {
    const client = await pool.connect();
    console.log('[DB] PostgreSQL connected');

    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        total_kills INTEGER DEFAULT 0,
        total_deaths INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
    `);

    console.log('[DB] Tables initialized');
    client.release();
  } catch (err) {
    console.warn('[DB] PostgreSQL not available, using in-memory fallback:', (err as Error).message);
    // The app will still work with in-memory auth service fallback
  }
}

export function getPool(): Pool {
  return pool;
}

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 80));
  }
  return result;
}
