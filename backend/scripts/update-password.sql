-- Update Jean Carmona's password to 12345
-- Run this in Render Shell: psql $DATABASE_URL -f scripts/update-password.sql

UPDATE users
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohXpMrD.Qj5WaW'
WHERE login_identifier = 'jeancarmona@complete-pet.com';

-- Verify the update
SELECT 
  full_name, 
  email, 
  login_identifier, 
  employee_id,
  substring(password_hash, 1, 20) as password_hash_preview,
  is_active
FROM users 
WHERE login_identifier = 'jeancarmona@complete-pet.com';

