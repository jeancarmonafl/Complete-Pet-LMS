import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixPassword() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to database...');
    
    // Update password to 12345 (bcrypt hash)
    const updateResult = await client.query(`
      UPDATE users
      SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohXpMrD.Qj5WaW'
      WHERE login_identifier = 'jeancarmona@complete-pet.com'
      RETURNING full_name, email, login_identifier, is_active
    `);
    
    if (updateResult.rowCount > 0) {
      console.log('✅ Password updated successfully!');
      console.log('User:', updateResult.rows[0]);
      console.log('\nYou can now login with:');
      console.log('  Email: jeancarmona@complete-pet.com');
      console.log('  Password: 12345');
      console.log('  Location: Florida (FL)');
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPassword();

