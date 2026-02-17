// Quick database connection test
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Try multiple connection approaches
async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL from .env:', process.env.DATABASE_URL);
  
  // Approach 1: Using connection string
  console.log('\n--- Approach 1: Connection String ---');
  try {
    const pool1 = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const result = await pool1.query('SELECT current_database(), current_user, version()');
    
    console.log('✅ Connection successful!');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('PostgreSQL Version:', result.rows[0].version.split(',')[0]);
    
    // Check if schemas exist
    const schemas = await pool1.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      ORDER BY schema_name
    `);
    
    console.log('\nAvailable schemas:', schemas.rows.map(r => r.schema_name).join(', '));
    
    await pool1.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  
  // Approach 2: Using individual parameters
  console.log('\n--- Approach 2: Individual Parameters ---');
  try {
    const pool2 = new Pool({
      user: 'fkmqtves',
      password: '.cQN@93%XqK5T[JT',
      host: 'localhost',
      port: 5432,
      database: 'fkmqtves_aban_remit',
    });
    
    const result = await pool2.query('SELECT current_database(), current_user');
    console.log('✅ Connection successful!');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    
    await pool2.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  
  console.log('\n⚠️  All connection attempts failed. Please verify:');
  console.log('1. Database host and port are correct');
  console.log('2. Database user and password are correct');
  console.log('3. Database allows connections from your IP');
  console.log('4. PostgreSQL service is running');
  
  process.exit(1);
}

testConnection();
