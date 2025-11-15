import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function markMigrationsComplete() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to database...');
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    console.log('✅ Created/verified schema_migrations table exists');
    
    // Check which tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\nExisting tables in database:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Migrations to mark as complete (the ones that have already been applied)
    const completedMigrations = [
      '001_init',
      '003_cleanup_users',
      '004_update_global_admin_locations',
      '005_course_status_and_exceptions'
    ];
    
    console.log('\nMarking migrations as complete...');
    
    for (const version of completedMigrations) {
      // Check if already marked
      const check = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );
      
      if (check.rows.length > 0) {
        console.log(`  ⏭️  ${version} already marked as complete`);
      } else {
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        console.log(`  ✅ Marked ${version} as complete`);
      }
    }
    
    console.log('\n✅ All existing migrations marked as complete!');
    console.log('\nNow you can run the new migration:');
    console.log('  node scripts/migrate.js');
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Failed:', error);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

markMigrationsComplete();

