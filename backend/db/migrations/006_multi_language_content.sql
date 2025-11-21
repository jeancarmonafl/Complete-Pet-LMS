-- Add multi-language content support
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS content_url_en TEXT,
  ADD COLUMN IF NOT EXISTS content_url_es TEXT,
  ADD COLUMN IF NOT EXISTS content_url_ne TEXT;

-- Migrate existing content_url to English (content_url_en)
UPDATE courses 
SET content_url_en = content_url 
WHERE content_url IS NOT NULL AND content_url_en IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN courses.content_url_en IS 'English language content URL';
COMMENT ON COLUMN courses.content_url_es IS 'Spanish language content URL';
COMMENT ON COLUMN courses.content_url_ne IS 'Nepalese language content URL';

