import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const testEmail = 'jeancarmona@complete-pet.com';
const testPassword = '12345';
const testLocation = 'FL';

try {
  console.log('🔍 Checking login issue...\n');
  
  // Check user exists
  const user = await pool.query(
    `SELECT u.*, l.code as location_code 
     FROM users u 
     LEFT JOIN locations l ON l.id = u.location_id 
     WHERE u.email = $1 OR u.login_identifier = $1`,
    [testEmail.toLowerCase()]
  );
  
  if (user.rows.length === 0) {
    console.log('❌ USER NOT FOUND!\n');
    const all = await pool.query('SELECT email, login_identifier FROM users');
    console.log('All users:', all.rows);
    process.exit(1);
  }
  
  const u = user.rows[0];
  console.log('✅ User found:');
  console.log(`   Email: ${u.email}`);
  console.log(`   Location: ${u.location_code}`);
  console.log(`   Active: ${u.is_active}`);
  console.log(`   Password hash length: ${u.password_hash?.length || 0}\n`);
  
  // Test login query
  const login = await pool.query(
    `SELECT u.id, u.password_hash, u.is_active, l.code as location_code
     FROM users u
     INNER JOIN locations l ON l.id = u.location_id
     WHERE (u.login_identifier = $1 OR u.email = $1) AND l.code = $2`,
    [testEmail.toLowerCase(), testLocation]
  );
  
  if (login.rows.length === 0) {
    console.log('❌ LOGIN QUERY FAILS - User not found with location FL\n');
    console.log('Available locations:');
    const locs = await pool.query('SELECT code, name FROM locations');
    console.table(locs.rows);
    process.exit(1);
  }
  
  const loginUser = login.rows[0];
  console.log('✅ Login query finds user');
  console.log(`   Location code: ${loginUser.location_code}`);
  console.log(`   Active: ${loginUser.is_active}\n`);
  
  // Test password
  if (!loginUser.password_hash || loginUser.password_hash.length < 20) {
    console.log('❌ Password hash is invalid!');
    process.exit(1);
  }
  
  const match = await bcrypt.compare(testPassword, loginUser.password_hash);
  if (match) {
    console.log('✅ Password matches - LOGIN SHOULD WORK!');
  } else {
    console.log('❌ Password does NOT match');
    console.log('💡 Need to reset password hash');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await pool.end();
}

