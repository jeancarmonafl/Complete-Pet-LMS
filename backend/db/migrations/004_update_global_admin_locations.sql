-- Ensure global admins are properly configured
-- This sets Jean Carmona and Admin as global admins with access to both locations

UPDATE users
SET app_role = 'global_admin'
WHERE login_identifier IN (
  'jeancarmona@complete-pet.com',
  'admin@complete-pet.com'
);

-- Note: Global admins have a "home" location_id but can switch between locations
-- The application logic allows them to query data from any location
