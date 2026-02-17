import pg from 'pg';

const { Pool } = pg;

/**
 * PostgreSQL connection pool
 * Uses DATABASE_URL from environment variables
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Execute a query with parameters
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  
  // Log slow queries (> 1 second)
  if (duration > 1000) {
    console.warn('Slow query detected:', { text, duration, rows: result.rowCount });
  }
  
  return result;
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

/**
 * Close the pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
