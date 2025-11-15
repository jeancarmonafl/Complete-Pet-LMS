-- Add active flag and exception positions to courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS exception_positions TEXT[];

