-- Add joined_date column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_date DATE;
