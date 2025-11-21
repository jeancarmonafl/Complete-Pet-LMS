# Deployment Instructions for Multi-Language Features

## Critical: Database Migration Required

The new multi-language features require database schema changes. You **MUST** run the migration before the application will work correctly.

## Current Issues (Before Migration)

1. ❌ **Dashboard not loading trainings** - 500 error on `/api/users/:id/activity`
2. ❌ **Course creation failing** - 500 error on `/api/courses` POST
3. **Root Cause**: Columns `content_url_en`, `content_url_es`, `content_url_ne` don't exist in production database yet

## Step-by-Step Deployment Process

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Add multi-language support and training approval workflow"
git push origin main
```

### 2. Wait for Automatic Deployments

- **Netlify** (Frontend): Will deploy automatically from GitHub
- **Render** (Backend): Will deploy automatically from GitHub

### 3. Run Database Migration on Render

This is the **CRITICAL STEP** that fixes all current errors:

#### Option A: Via Render Dashboard (Recommended)

1. Go to https://dashboard.render.com
2. Select your backend service (complete-pet-lms-api)
3. Click on "Shell" tab
4. Run this command:

```bash
npm run migrate
```

5. Wait for success message: "✅ All migrations completed successfully!"

#### Option B: Via Local Connection to Production DB

If you have the `DATABASE_URL` connection string:

```bash
cd backend
DATABASE_URL="your-production-database-url" npm run migrate
```

### 4. Verify the Migration

After running the migration, check that the new columns exist:

1. Go to Render Dashboard → PostgreSQL database
2. Open "Query" tab
3. Run:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND column_name LIKE 'content_url%';
```

You should see:
- `content_url`
- `content_url_en`
- `content_url_es`
- `content_url_ne`

### 5. Test the Application

Once the migration is complete:

1. ✅ **Dashboard should load trainings** - No more 500 errors
2. ✅ **Course creation should work** - Can now create courses with multi-language content
3. ✅ **Training flow should work** - Language selection appears before content

## Migration Details

The migration adds these columns to the `courses` table:

```sql
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS content_url_en TEXT,
  ADD COLUMN IF NOT EXISTS content_url_es TEXT,
  ADD COLUMN IF NOT EXISTS content_url_ne TEXT;
```

And migrates existing data:

```sql
UPDATE courses 
SET content_url_en = content_url 
WHERE content_url IS NOT NULL AND content_url_en IS NULL;
```

## What Changed

### Backend Changes

1. **New Columns**: `content_url_en`, `content_url_es`, `content_url_ne` in `courses` table
2. **New API Endpoints**:
   - `GET /api/courses/:id/quiz` - Fetch actual quiz questions
   - `POST /api/training-records` - Create training completion record
   - `GET /api/training-records` - List all training records
   - `GET /api/training-records/pending` - List pending approvals
   - `PATCH /api/training-records/:id/approve` - Approve training
   - `PATCH /api/training-records/:id/deny` - Deny and reset training

3. **Updated Services**:
   - `userService.ts` - Now includes quiz questions and multi-language URLs in activity
   - `courseService.ts` - Handles multi-language content uploads
   - `trainingRecordService.ts` - New service for training records

### Frontend Changes

1. **Multi-Language Course Upload** (`CourseManagementPage.tsx`):
   - Three file upload fields (English, Spanish, Nepalese)
   - All three languages required when publishing

2. **Language Selection in Training** (`TrainingFlowModal.tsx`):
   - New step before content: Language selection screen
   - Loads appropriate video/PDF based on selection

3. **Approval Workflow** (`DashboardPage.tsx`, `SupervisorApprovalModal.tsx`):
   - Admins see pending approvals queue
   - Can approve (adds to matrix) or deny (resets training)

4. **Training Matrix** (`TrainingMatrixPage.tsx`):
   - Now fetches from API instead of local state
   - Shows real completion records with PDF generation

5. **Quiz Questions** (`DashboardPage.tsx`):
   - Now uses actual questions from course creation
   - No more placeholder/randomized questions

## Troubleshooting

### If Dashboard Still Shows Errors After Migration

1. **Check migration status**:
```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

Should show `006_multi_language_content` in the list.

2. **Manually verify columns exist**:
```sql
\d courses
```

3. **Check backend logs** on Render:
   - Go to your backend service
   - Click "Logs" tab
   - Look for any SQL errors

### If Course Creation Still Fails

1. **Check uploaded file URLs** in browser console
2. **Verify all 3 languages are uploaded** before clicking "Create"
3. **Check that `isPublished` is true** - validation requires all 3 languages when publishing

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

1. **Remove migration from tracking**:
```sql
DELETE FROM schema_migrations WHERE version = '006_multi_language_content';
```

2. **Drop new columns**:
```sql
ALTER TABLE courses
  DROP COLUMN IF EXISTS content_url_en,
  DROP COLUMN IF EXISTS content_url_es,
  DROP COLUMN IF EXISTS content_url_ne;
```

3. **Revert code**: 
```bash
git revert HEAD
git push origin main
```

## Support

If you encounter issues:

1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify migration ran successfully
4. Check that `DATABASE_URL` is correct in Render environment variables

