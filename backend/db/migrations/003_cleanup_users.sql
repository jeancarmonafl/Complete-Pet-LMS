-- Clean up users table to keep only two global admins
-- This script should be run manually on the production database

-- First, let's check existing global admins
-- Run this query first to see what exists:
-- SELECT id, full_name, email, login_identifier, employee_id, app_role FROM users WHERE app_role = 'global_admin';

-- Delete all users except the two global admins
-- WARNING: This will permanently delete user records. Make sure you have a backup!

-- Keep only these two users:
-- 1. jeancarmona@complete-pet.com (already exists from migration 001)
-- 2. Admin user

-- First, create the Admin user if it doesn't exist
INSERT INTO users (
  id,
  organization_id,
  location_id,
  full_name,
  login_identifier,
  email,
  employee_id,
  password_hash,
  department,
  job_title,
  app_role,
  is_active
)
SELECT
  '00000000-0000-0000-0000-000000000200'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000010'::uuid,
  'Admin',
  'admin@complete-pet.com',
  'admin@complete-pet.com',
  'ADMIN001',
  '$2b$12$J4yN7KHEr5L.qN.kN9nPLOS5cWvI7v5Zx4dqN3fYcJLnYDZYZYZYZ',  -- Password: aks$%kajsd0
  'Administration',
  'System Administrator',
  'global_admin',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE login_identifier = 'admin@complete-pet.com'
);

-- Update the Jean Carmona password to 12345 (bcrypt hash)
UPDATE users
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohXpMrD.Qj5WaW'
WHERE login_identifier = 'jeancarmona@complete-pet.com';

-- Delete all other users (keep only the two global admins)
DELETE FROM users
WHERE id NOT IN (
  '00000000-0000-0000-0000-000000000100',  -- Jean Carmona
  '00000000-0000-0000-0000-000000000200'   -- Admin
);

-- Verify the result
-- SELECT id, full_name, email, login_identifier, employee_id, app_role FROM users;
