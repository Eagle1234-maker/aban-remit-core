/**
 * Simple database connection test
 * Tests if the DATABASE_URL in .env connects successfully
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('\n==============================================');
console.log('DATABASE CONNECTION TEST');
console.log('==============================================\n');

console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
console.log('');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    console.log('Testing connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✓ Connected to database');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version(), current_database(), current_user`;
    console.log('✓ Query executed successfully');
    console.log('');
    console.log('Database Info:');
    console.log(result);
    
    // Test schemas
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('auth', 'core', 'ledger', 'audit', 'services')
      ORDER BY schema_name
    `;
    console.log('');
    console.log('Available Schemas:');
    console.log(schemas);
    
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
      if (error.message.includes("Can't reach database server")) {
        console.error('Troubleshooting:');
        console.error('1. Verify PostgreSQL is running');
        console.error('2. Check DATABASE_URL in .env file');
        console.error('3. Verify host, port, username, and password');
        console.error('4. Check firewall settings');
      } else if (error.message.includes('password authentication failed')) {
        console.error('Troubleshooting:');
        console.error('1. Verify password in .env file');
        console.error('2. Check if user exists in PostgreSQL');
        console.error('3. Reset password if needed');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('Troubleshooting:');
        console.error('1. Create the database in PostgreSQL');
        console.error('2. Verify database name in .env file');
      }
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
