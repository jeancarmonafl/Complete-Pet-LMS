#!/usr/bin/env node

/**
 * Diagnostic script to check why login is failing
 * Run this in Render Shell: node scripts/check-login-issue.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function diagnoseLogin() {
  console.log('🔍 Diagnosing Login Issue...\n');
  
  const testEmail = 'jeancarmona@complete-pet.com';
  const testPassword = '12345';
  const testLocation = 'FL';
  
  try {
    // 1. Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const userQuery = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.login_identifier, 
              u.password_hash, u.is_active, u.app_role,
              l.code as location_code, l.name as location_name
       FROM users u
       LEFT JOIN locations l ON l.id = u.location_id
       WHERE u.email = $1 OR u.login_identifier = $1`,
      [testEmail.toLowerCase()]
    );
    
    if (userQuery.rows.length === 0) {
      console.log('❌ USER NOT FOUND!');
      console.log('\nChecking all users in database:');
      const allUsers = await pool.query('SELECT email, login_identifier, app_role FROM users');
      console.table(allUsers.rows);
      await pool.end();
      return;
    }
    
    const user = userQuery.rows[0];
    console.log('✅ User found:');
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Login Identifier: ${user.login_identifier}`);
    console.log(`   Role: ${user.app_role}`);
    console.log(`   Location: ${user.location_name} (${user.location_code})`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Password Hash Length: ${user.password_hash?.length || 0}`);
    
    // 2. Check location match
    console.log('\n2️⃣ Checking location match...');
    if (user.location_code !== testLocation) {
      console.log(`❌ LOCATION MISMATCH!`);
      console.log(`   User location: ${user.location_code}`);
      console.log(`   Login location: ${testLocation}`);
      console.log('\n💡 Try logging in with location:', user.location_code);
    } else {
      console.log(`✅ Location matches: ${user.location_code}`);
    }
    
    // 3. Check if user is active
    console.log('\n3️⃣ Checking if user is active...');
    if (!user.is_active) {
      console.log('❌ USER IS INACTIVE!');
      console.log('💡 Fix: UPDATE users SET is_active = true WHERE email = $1');
    } else {
      console.log('✅ User is active');
    }
    
    // 4. Test password verification
    console.log('\n4️⃣ Testing password verification...');
    if (!user.password_hash || user.password_hash.length < 20) {
      console.log('❌ PASSWORD HASH IS INVALID!');
      console.log(`   Hash length: ${user.password_hash?.length || 0}`);
      console.log('💡 Password needs to be rehashed');
    } else {
      try {
        const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
        if (passwordMatch) {
          console.log('✅ Password verification PASSED');
        } else {
          console.log('❌ Password verification FAILED');
          console.log('💡 Password hash does not match "12345"');
          console.log('\nTesting with a fresh hash...');
          const freshHash = await bcrypt.hash(testPassword, 12);
          console.log('Fresh hash:', freshHash.substring(0, 30) + '...');
          const freshMatch = await bcrypt.compare(testPassword, freshHash);
          console.log('Fresh hash test:', freshMatch ? '✅ PASS' : '❌ FAIL');
        }
      } catch (error) {
        console.log('❌ Password verification ERROR:', error.message);
      }
    }
    
    // 5. Test the exact login query
    console.log('\n5️⃣ Testing exact login query...');
    const loginQuery = await pool.query(
      `SELECT u.id,
              u.full_name AS "fullName",
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
      [testEmail.toLowerCase(), testLocation]
    );
    
    if (loginQuery.rows.length === 0) {
      console.log('❌ LOGIN QUERY RETURNS NO RESULTS!');
      console.log('This is why login fails.');
      console.log('\nPossible causes:');
      console.log('  - Location code mismatch');
      console.log('  - User not linked to location');
      console.log('  - Location doesn\'t exist');
    } else {
      const loginUser = loginQuery.rows[0];
      console.log('✅ Login query found user');
      console.log(`   User ID: ${loginUser.id}`);
      console.log(`   Location Code: ${loginUser.locationCode}`);
      console.log(`   Active: ${loginUser.isActive}`);
      
      // Test password
      const loginPasswordMatch = await bcrypt.compare(testPassword, loginUser.passwordHash);
      if (loginPasswordMatch) {
        console.log('✅ Password matches - LOGIN SHOULD WORK!');
      } else {
        console.log('❌ Password does not match');
      }
    }
    
    // 6. List all locations
    console.log('\n6️⃣ Available locations:');
    const locations = await pool.query('SELECT code, name FROM locations ORDER BY code');
    console.table(locations.rows);
    
    // 7. List all users with their locations
    console.log('\n7️⃣ All users and their locations:');
    const allUsersWithLocations = await pool.query(
      `SELECT u.email, u.login_identifier, u.app_role, 
              l.code as location_code, u.is_active
       FROM users u
       LEFT JOIN locations l ON l.id = u.location_id
       ORDER BY l.code, u.email`
    );
    console.table(allUsersWithLocations.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

diagnoseLogin();

