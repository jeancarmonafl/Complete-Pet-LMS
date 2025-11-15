import pkg from 'pg';
const { Pool } = pkg;
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to database...');
    
    // Get all migration files and sort them
    const migrationsDir = join(__dirname, '../db/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure order (001, 002, 003, etc.)
    
    console.log(`Found ${migrationFiles.length} migration files:`, migrationFiles);
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Run each migration
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');
      
      // Check if migration already applied
      const result = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );
      
      if (result.rows.length > 0) {
        console.log(`⏭️  Migration ${version} already applied, skipping...`);
        continue;
      }
      
      console.log(`\n📋 Running migration: ${file}...`);
      const migrationSQL = readFileSync(
        join(migrationsDir, file),
        'utf-8'
      );
      
      await client.query('BEGIN');
      try {
        await client.query(migrationSQL);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        await client.query('COMMIT');
        console.log(`✅ Migration ${version} completed successfully!`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    
    console.log('\n✅ All migrations completed successfully!');
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

runMigrations();

