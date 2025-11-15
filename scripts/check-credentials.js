import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkCredentials() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node scripts/check-credentials.js <identifier> <password> <locationCode>');
    console.log('Example: node scripts/check-credentials.js jeancarmona@complete-pet.com 12345 FL');
    process.exit(1);
  }
  
  const [identifier, password, locationCode] = args;
  const normalizedIdentifier = identifier.toLowerCase();
  const normalizedLocationCode = locationCode.toUpperCase();
  
  console.log('🔍 Checking credentials...');
  console.log(`  Identifier: ${normalizedIdentifier}`);
  console.log(`  Location: ${normalizedLocationCode}`);
  console.log('');
  
  try {
    // Check if user exists
    const userQuery = await pool.query(
      `SELECT u.id,
              u.full_name AS "fullName",
              u.login_identifier,
              u.email,
              u.password_hash AS "passwordHash",
              u.app_role AS role,
              u.organization_id AS "organizationId",
              u.location_id AS "locationId",
              l.code AS "locationCode",
              u.is_active AS "isActive"
       FROM users u
       INNER JOIN locations l ON l.id = u.location_id
       WHERE (u.login_identifier = $1 OR u.email = $1)
         AND l.code = $2`,
      [normalizedIdentifier, normalizedLocationCode]
    );
    
    if (userQuery.rows.length === 0) {
      console.log('❌ User not found or location mismatch');
      console.log('');
      console.log('Checking all users in database...');
      const allUsers = await pool.query(
        `SELECT u.login_identifier, u.email, l.code AS location_code
         FROM users u
         INNER JOIN locations l ON l.id = u.location_id
         LIMIT 10`
      );
      console.log(`Found ${allUsers.rows.length} users:`);
      allUsers.rows.forEach(user => {
        console.log(`  - ${user.login_identifier || user.email} (${user.location_code})`);
      });
      process.exit(1);
    }
    
    const user = userQuery.rows[0];
    console.log('✅ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.fullName}`);
    console.log(`  Login ID: ${user.login_identifier}`);
    console.log(`  Email: ${user.email || 'N/A'}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Location: ${user.locationCode}`);
    console.log(`  Is Active: ${user.isActive}`);
    console.log('');
    
    if (!user.isActive) {
      console.log('❌ User is not active');
      process.exit(1);
    }
    
    console.log('🔐 Verifying password...');
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (passwordValid) {
      console.log('✅ Password is correct!');
      console.log('');
      console.log('✅ All credentials are valid!');
      console.log('');
      console.log('You can use these credentials to login:');
      console.log(`  Identifier: ${normalizedIdentifier}`);
      console.log(`  Password: ${password}`);
      console.log(`  Location: ${normalizedLocationCode}`);
    } else {
      console.log('❌ Password is incorrect');
      console.log('');
      console.log('Note: The password hash in database is:');
      console.log(`  ${user.passwordHash.substring(0, 30)}...`);
      process.exit(1);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkCredentials();

