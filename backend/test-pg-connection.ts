/**
 * Simple PostgreSQL connection test using pg library directly
 * Bypasses Prisma to test raw connection
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

console.log('\n==============================================');
console.log('POSTGRESQL DIRECT CONNECTION TEST');
console.log('==============================================\n');

console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
console.log('');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

async function testConnection() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('✓ Connected successfully');
    console.log('');
    
    // Test basic query
    console.log('Testing basic query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('✓ Query executed successfully');
    console.log('');
    console.log('Database Info:');
    console.log(result.rows[0]);
    console.log('');
    
    // Check schemas
    console.log('Checking available schemas...');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('auth', 'core', 'ledger', 'audit', 'services', 'public')
      ORDER BY schema_name
    `);
    console.log('Available Schemas:');
    schemas.rows.forEach(row => console.log(`  - ${row.schema_name}`));
    console.log('');
    
    // Check tables
    console.log('Checking tables...');
    const tables = await client.query(`
      SELECT schemaname, COUNT(*) as table_count
      FROM pg_tables 
      WHERE schemaname IN ('auth', 'core', 'ledger', 'audit', 'services', 'public')
      GROUP BY schemaname
      ORDER BY schemaname
    `);
    console.log('Tables by Schema:');
    tables.rows.forEach(row => console.log(`  - ${row.schemaname}: ${row.table_count} tables`));
    console.log('');
    
    console.log('==============================================');
    console.log('✓ CONNECTION TEST PASSED');
    console.log('==============================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('==============================================');
    console.error('✗ CONNECTION TEST FAILED');
    console.error('==============================================');
    console.error('');
    console.error('Error:', error);
    console.error('');
    
    if (error instanceof Error) {
      if (error.message.includes('password authentication failed')) {
        console.error('Troubleshooting:');
        console.error('1. Verify password in .env file');
        console.error('2. Check if user exists in PostgreSQL');
        console.error('3. Verify pg_hba.conf allows password authentication');
      } else if (error.message.includes('Connection refused')) {
        console.error('Troubleshooting:');
        console.error('1. Verify PostgreSQL is running');
        console.error('2. Check if port 5432 is correct');
        console.error('3. Verify host is correct (localhost vs IP)');
      }
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection();
