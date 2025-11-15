#!/usr/bin/env node

/**
 * Complete LMS Diagnostic and Recovery Script
 * This script will diagnose and fix common issues with the development environment
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://devuser:devpass123@localhost:5432/complete_pet_lms_dev';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  Complete-Pet LMS - Diagnostic & Recovery Tool                ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

const issues = [];
const fixes = [];

async function checkDocker() {
  console.log('🐳 Checking Docker...');
  try {
    await execAsync('docker --version');
    console.log('   ✅ Docker is installed');
    
    try {
      await execAsync('docker info');
      console.log('   ✅ Docker is running');
      return true;
    } catch {
      issues.push('Docker is installed but not running');
      fixes.push('Start Docker Desktop');
      console.log('   ❌ Docker is not running');
      return false;
    }
  } catch {
    issues.push('Docker is not installed');
    fixes.push('Install Docker Desktop from https://www.docker.com/products/docker-desktop');
    console.log('   ❌ Docker is not installed');
    return false;
  }
}

async function checkDatabase() {
  console.log('\n📦 Checking Database Container...');
  try {
    const { stdout } = await execAsync('docker ps --filter "name=complete-pet-lms-dev-db" --format "{{.Status}}"');
    if (stdout.trim()) {
      console.log('   ✅ Database container is running');
      return true;
    } else {
      issues.push('Database container is not running');
      fixes.push('Run: docker-compose -f docker-compose.dev.yml up -d');
      console.log('   ❌ Database container is not running');
      return false;
    }
  } catch {
    issues.push('Database container is not running');
    fixes.push('Run: docker-compose -f docker-compose.dev.yml up -d');
    console.log('   ❌ Database container is not running');
    return false;
  }
}

async function checkDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('   ✅ Database connection successful');
    await pool.end();
    return true;
  } catch (error) {
    issues.push(`Cannot connect to database: ${error.message}`);
    fixes.push('Ensure database is running and credentials are correct');
    console.log(`   ❌ Database connection failed: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function checkMigrations() {
  console.log('\n📋 Checking Database Migrations...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    // Check if migrations table exists
    const migrationTableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'migrations'
      );`
    );

    if (!migrationTableCheck.rows[0].exists) {
      issues.push('Migrations table does not exist');
      fixes.push('Run: cd backend && npm run migrate');
      console.log('   ❌ Migrations table not found');
      await pool.end();
      return false;
    }

    // Check completed migrations
    const migrations = await pool.query('SELECT * FROM migrations ORDER BY id');
    console.log(`   ✅ Found ${migrations.rows.length} completed migrations`);
    
    migrations.rows.forEach(m => {
      console.log(`      - ${m.name} (${new Date(m.executed_at).toLocaleDateString()})`);
    });

    await pool.end();
    return true;
  } catch (error) {
    issues.push(`Migration check failed: ${error.message}`);
    fixes.push('Run: cd backend && npm run migrate');
    console.log(`   ❌ Migration check failed: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function checkUsers() {
  console.log('\n👥 Checking Test Users...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.login_identifier, u.app_role, 
              l.code as location_code, u.is_active, 
              LENGTH(u.password_hash) as password_hash_length
       FROM users u
       INNER JOIN locations l ON l.id = u.location_id
       ORDER BY u.app_role, u.full_name`
    );

    if (result.rows.length === 0) {
      issues.push('No users found in database');
      fixes.push('Run: cd backend && npm run seed');
      console.log('   ❌ No users found in database');
      await pool.end();
      return false;
    }

    console.log(`   ✅ Found ${result.rows.length} users:`);
    console.log('');
    console.log('   Role            | Email                              | Location | Active | Password');
    console.log('   ' + '─'.repeat(88));
    
    result.rows.forEach(user => {
      const role = user.app_role.padEnd(15);
      const email = user.email.padEnd(35);
      const location = user.location_code.padEnd(8);
      const active = user.is_active ? '✓' : '✗';
      const pwStatus = user.password_hash_length > 20 ? 'Hashed' : 'WEAK!';
      console.log(`   ${role} | ${email} | ${location} | ${active}      | ${pwStatus}`);
    });

    await pool.end();
    return true;
  } catch (error) {
    issues.push(`User check failed: ${error.message}`);
    console.log(`   ❌ User check failed: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Login Authentication...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    // Test with the main admin user
    const testEmail = 'jeancarmona@complete-pet.com';
    const testPassword = '12345';
    const testLocation = 'FL';

    const userQuery = await pool.query(
      `SELECT u.id, u.full_name, u.password_hash, u.app_role, u.is_active
       FROM users u
       INNER JOIN locations l ON l.id = u.location_id
       WHERE (u.login_identifier = $1 OR u.email = $1)
         AND l.code = $2`,
      [testEmail, testLocation]
    );

    if (userQuery.rows.length === 0) {
      issues.push(`Test user ${testEmail} not found`);
      fixes.push('Run: cd backend && npm run seed');
      console.log(`   ❌ Test user not found: ${testEmail}`);
      await pool.end();
      return false;
    }

    const user = userQuery.rows[0];
    console.log(`   ✅ Found user: ${user.full_name} (${user.app_role})`);

    // Test password verification
    const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
    
    if (passwordMatch) {
      console.log(`   ✅ Password verification successful!`);
      console.log('');
      console.log('   🎉 LOGIN TEST PASSED!');
      console.log(`   You should be able to login with:`);
      console.log(`      Email: ${testEmail}`);
      console.log(`      Password: ${testPassword}`);
      console.log(`      Location: ${testLocation}`);
    } else {
      issues.push('Password verification failed');
      fixes.push('Run: cd backend && npm run seed (to reset passwords)');
      console.log(`   ❌ Password verification failed`);
    }

    await pool.end();
    return passwordMatch;
  } catch (error) {
    issues.push(`Login test failed: ${error.message}`);
    console.log(`   ❌ Login test failed: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function checkEnvironmentFiles() {
  console.log('\n📄 Checking Environment Files...');
  
  try {
    const backendEnv = process.env.DATABASE_URL && process.env.JWT_SECRET;
    if (backendEnv) {
      console.log('   ✅ backend/.env exists and has required variables');
    } else {
      issues.push('backend/.env is missing or incomplete');
      fixes.push('Ensure backend/.env has DATABASE_URL, JWT_SECRET, etc.');
      console.log('   ❌ backend/.env is missing or incomplete');
    }

    // Check if backend dependencies are installed
    try {
      await execAsync('test -d backend/node_modules');
      console.log('   ✅ Backend node_modules exists');
    } catch {
      issues.push('Backend dependencies not installed');
      fixes.push('Run: cd backend && npm install');
      console.log('   ❌ Backend node_modules not found');
    }

    // Check if frontend dependencies are installed
    try {
      await execAsync('test -d frontend/node_modules');
      console.log('   ✅ Frontend node_modules exists');
    } catch {
      issues.push('Frontend dependencies not installed');
      fixes.push('Run: cd frontend && npm install');
      console.log('   ❌ Frontend node_modules not found');
    }

    return backendEnv;
  } catch (error) {
    console.log(`   ⚠️  Environment check warning: ${error.message}`);
    return false;
  }
}

async function runDiagnostics() {
  const dockerOk = await checkDocker();
  
  if (!dockerOk) {
    printSummary();
    return;
  }

  const dbContainerOk = await checkDatabase();
  
  if (!dbContainerOk) {
    printSummary();
    return;
  }

  const dbConnectionOk = await checkDatabaseConnection();
  
  if (!dbConnectionOk) {
    printSummary();
    return;
  }

  await checkEnvironmentFiles();
  await checkMigrations();
  const usersOk = await checkUsers();
  
  if (usersOk) {
    await testLogin();
  }

  printSummary();
}

function printSummary() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  DIAGNOSTIC SUMMARY                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  if (issues.length === 0) {
    console.log('✅ All checks passed! Your development environment is ready.');
    console.log('');
    console.log('🚀 TO START THE SERVERS:');
    console.log('');
    console.log('Terminal 1 (Backend):');
    console.log('  cd backend && npm run dev');
    console.log('');
    console.log('Terminal 2 (Frontend):');
    console.log('  cd frontend && npm run dev');
    console.log('');
    console.log('Then open: http://localhost:5173');
    console.log('');
    console.log('🔑 TEST CREDENTIALS (password: 12345):');
    console.log('  • jeancarmona@complete-pet.com (Location: FL)');
    console.log('  • admin@complete-pet.com (Location: FL)');
    console.log('  • manager@complete-pet.com (Location: FL)');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):\n`);
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    
    console.log('\n💡 RECOMMENDED FIXES:\n');
    fixes.forEach((fix, i) => {
      console.log(`${i + 1}. ${fix}`);
    });
    
    console.log('\n📚 QUICK FIX - Run this command:');
    console.log('   ./scripts/setup-localhost-dev.sh');
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

