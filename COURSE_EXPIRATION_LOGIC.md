# Course Expiration and Re-take Logic - 21 CFR Part 11 Compliant

## Overview

This document outlines the implementation requirements for course expiration and re-take behavior in the Complete-Pet LMS.

**CRITICAL**: This system must maintain 21 CFR Part 11 compliance for pharmaceutical/FDA-regulated environments. All training records are permanent and must maintain complete audit trails.

## Requirements

### 1. 21 CFR Part 11 Compliance - Record Retention

**CRITICAL REQUIREMENT**: Historical records must NEVER be deleted or overwritten.

When a training expires or is updated:

- ✅ Create a NEW completion record
- ✅ Mark the old record as `expired` or `superseded`
- ✅ Maintain ALL previous records in the database
- ✅ Allow users to view and export any historical record
- ✅ Each record version must be independently viewable and exportable as CVS-ADM-005 PDF

#### Database Design for Historical Records:

```sql
CREATE TABLE course_completions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  record_version INTEGER NOT NULL, -- 1, 2, 3... for same user+course
  completion_date TIMESTAMP NOT NULL,
  expiration_date TIMESTAMP NOT NULL,
  quiz_score INTEGER NOT NULL,
  pass_percentage INTEGER NOT NULL,
  video_watch_duration INTEGER NOT NULL, -- minutes
  quiz_completion_time INTEGER NOT NULL, -- minutes
  total_training_time INTEGER GENERATED ALWAYS AS (video_watch_duration + quiz_completion_time) STORED,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'superseded'

  -- Electronic Signature Fields (21 CFR Part 11)
  employee_signature TEXT NOT NULL,
  employee_signature_date TIMESTAMP NOT NULL,
  supervisor_name VARCHAR(255) NOT NULL,
  supervisor_signature TEXT NOT NULL,
  supervisor_signature_date TIMESTAMP NOT NULL,

  -- Audit Trail
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure version uniqueness per user+course
  UNIQUE(user_id, course_id, record_version)
);

-- Index for efficient historical record retrieval
CREATE INDEX idx_completions_user_course ON course_completions(user_id, course_id, record_version DESC);
CREATE INDEX idx_completions_status ON course_completions(status);
```

### 2. One-Year Expiration

All training courses must have a **1-year expiration period** from the date of completion.

#### Implementation Details:

- When a user completes a course (passes the quiz), record:
  - `completion_date`: timestamp of completion
  - `expiration_date`: completion_date + 365 days
  - `record_version`: Auto-increment for this user+course combination
  - All timing data (video watch time, quiz completion time)
  - Electronic signatures (employee and supervisor)

#### User Experience:

- **90 days before expiration**: Display a warning notification to the user
- **30 days before expiration**: Display an urgent notification
- **On expiration date**:
  - Mark the OLD completion as `expired` (do NOT delete)
  - Create notification for re-take requirement
  - Old record remains viewable in Training Matrix
- Dashboard should show:
  - "Expiring Soon" section for courses expiring within 30 days
  - "Expired" section for courses that have expired
- Training Matrix should:
  - Show latest record by default
  - Provide "View History" button when multiple records exist
  - Allow generation of CVS-ADM-005 PDF for ANY record version

### 3. CVS-ADM-005 Rev 004 PDF Generation

Every training completion record must be exportable as a CVS-ADM-005 Rev 004 PDF document.

#### Required PDF Content:

1. **Header**: "Complete-Pet Training Completion Record" | "CVS-ADM-005 Rev 004"
2. **Employee Information**:
   - Last Name, First Name
   - Employee ID
   - Department
   - Job Title
3. **Training Information**:
   - SOP Number (Course ID)
   - Training Title
   - Training Description
   - Content Type
4. **Completion Details**:
   - Video Watch Duration (minutes)
   - Quiz Completion Time (minutes)
   - Total Training Time
   - Quiz Score (percentage)
   - Pass/Fail Result
   - Completion Date (full timestamp)
   - Expiration Date (full timestamp)
5. **Electronic Signatures** (21 CFR Part 11 compliant):
   - Employee Signature with date/time stamp
   - Supervisor/Administrator Signature with date/time stamp
   - Both must include full name and timestamp
6. **Compliance Notice**: 21 CFR Part 11 statement
7. **Footer**: Document number, generation timestamp, confidentiality notice
8. **Record Version**: Clearly labeled (e.g., "ACTIVE - Record Version 2")

#### PDF Generation:

- Use `html2pdf.js` library
- Open in new browser tab
- Filename format: `CVS-ADM-005_{SOP#}_{LastName}_{EmpID}_v{Version}_{Date}.pdf`
- Example: `CVS-ADM-005_SOP-101_Carmona_EMP001_v2_20251025.pdf`

### 4. Course Content/Quiz Update Behavior

When an administrator updates a course's content or quiz:

#### What Triggers Re-take:

- Uploading a new content file (video, PDF, etc.)
- Modifying any quiz questions or answers
- Changing the correct answer for any question

#### Implementation:

```typescript
interface Course {
  id: string;
  title: string;
  content_version: number; // Increment on content update
  quiz_version: number; // Increment on quiz update
  last_modified: Date;
}

interface CourseCompletion {
  user_id: string;
  course_id: string;
  completed_content_version: number;
  completed_quiz_version: number;
  completion_date: Date;
}
```

#### User Experience:

- When course is updated, compare:
  - `course.content_version` vs `completion.completed_content_version`
  - `course.quiz_version` vs `completion.completed_quiz_version`
- If versions don't match:
  - Mark previous completion as `outdated`
  - Create a new assignment for the user
  - Display notification: "Course [Title] has been updated. Please review the new content and re-take the quiz."
  - User must:
    1. Re-watch/review the content (unless admin marks as "quiz-only update")
    2. Re-take the quiz

### 5. Re-take Process (Maintaining Historical Records)

#### For Expired Courses:

1. User receives notification
2. User clicks to re-take
3. System creates a NEW enrollment record
4. User must:
   - Review the content again
   - Take the quiz again
   - Provide electronic signature
5. Upon completion:
   - Previous completion is marked as `expired` (**NEVER DELETED**)
   - New completion record created with `record_version` = old_version + 1
   - New record marked as `active`
   - New completion gets a fresh 1-year expiration
6. Training Matrix shows:
   - Latest record prominently
   - "View 1 Previous Record" button (or "View X Previous Records")
   - All historical records accessible with PDF generation

#### For Updated Courses:

1. User receives notification about updates
2. System highlights what changed (content, quiz, or both)
3. User must review updated portions
4. User takes the quiz
5. If passed:
   - Previous completion marked as `superseded` (**NEVER DELETED**)
   - New completion recorded with incremented `record_version`
   - New completion includes current content_version and quiz_version
   - New 1-year expiration starts
6. Training Matrix maintains full history:
   - Shows which version was completed
   - All previous versions remain accessible
   - Each version can be exported as CVS-ADM-005 PDF

### 6. Compliance Reporting (21 CFR Part 11)

The system must track and report:

- **Total completions** (current + historical) - Never decreases
- **Active completions** (status = 'active')
- **Expired completions** (status = 'expired')
- **Superseded completions** (status = 'superseded')
- **Upcoming expirations** (within 30/60/90 days)
- **Compliance rate** = (Active Completions / Total Required Assignments) × 100
- **Complete audit trail** with all record versions
- **Electronic signature verification** for all records
- **Time-stamped changes** to any training record

#### Audit Trail Requirements:

- Every record version must be independently retrievable
- No record can be permanently deleted (soft deletes only if needed)
- All status changes must be logged with timestamp and user
- PDF generation must be available for any historical record
- Export functionality must include all versions

### 7. Backend API Endpoints Needed

```typescript
// Check for expired courses
GET /api/courses/expiring-soon?userId={id}&days={30}

// Get user's course status (latest record)
GET /api/users/{userId}/courses/{courseId}/status
Response: {
  hasCompleted: boolean,
  latestRecord: CompletionRecord | null,
  isExpired: boolean,
  needsRetake: boolean,
  reason: 'expired' | 'updated' | 'active',
  totalVersions: number
}

// Get ALL completion records for a user+course (21 CFR Part 11)
GET /api/users/{userId}/courses/{courseId}/history
Response: {
  records: CompletionRecord[], // All versions, sorted by version DESC
  totalRecords: number
}

// Get specific record version
GET /api/completions/{recordId}
Response: CompletionRecord with all details for PDF generation

// Trigger re-take (creates new version)
POST /api/users/{userId}/courses/{courseId}/retake
Body: { reason: 'expired' | 'updated' }
Response: { newRecordVersion: number }

// Record completion (with electronic signatures)
POST /api/users/{userId}/courses/{courseId}/complete
Body: {
  quizScore: number,
  videoWatchDuration: number,
  quizCompletionTime: number,
  employeeSignature: string,
  employeeSignatureDate: Date,
  supervisorName: string,
  supervisorSignature: string,
  supervisorSignatureDate: Date
}

// Get compliance report
GET /api/reports/compliance?department={dept}&dateRange={range}&includeHistorical={bool}

// Export audit trail
GET /api/reports/audit-trail?userId={id}&courseId={id}&format=csv
```

### 6. Notifications

Implement automated email/in-app notifications:

- 90 days before expiration
- 30 days before expiration
- On expiration day
- When course is updated
- Daily digest of upcoming expirations (for supervisors)

### 7. Database Migrations

```sql
-- Add version tracking to courses table
ALTER TABLE courses
ADD COLUMN content_version INTEGER DEFAULT 1,
ADD COLUMN quiz_version INTEGER DEFAULT 1,
ADD COLUMN last_content_update TIMESTAMP,
ADD COLUMN last_quiz_update TIMESTAMP;

-- Create trigger to increment versions
CREATE OR REPLACE FUNCTION increment_course_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content_url != OLD.content_url THEN
    NEW.content_version = OLD.content_version + 1;
    NEW.last_content_update = CURRENT_TIMESTAMP;
  END IF;

  IF NEW.quiz_questions != OLD.quiz_questions THEN
    NEW.quiz_version = OLD.quiz_version + 1;
    NEW.last_quiz_update = CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_version_trigger
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION increment_course_version();
```

## Testing Checklist

- [ ] Course completion records expiration date correctly
- [ ] User receives notification 90 days before expiration
- [ ] User receives notification 30 days before expiration
- [ ] Expired course appears in "Expired" section
- [ ] Re-take creates new enrollment with new expiration
- [ ] Content update triggers re-take for all users
- [ ] Quiz update triggers re-take for all users
- [ ] Compliance report shows accurate data
- [ ] Historical completions are preserved
- [ ] Dashboard shows expiring/expired courses correctly

## Implementation Priority

1. **High Priority** (MVP):

   - Basic expiration tracking (completion_date + 365 days)
   - Mark courses as expired
   - Allow re-take of expired courses
   - Dashboard warning for expiring courses

2. **Medium Priority**:

   - Version tracking for courses
   - Automatic re-assignment on course update
   - Email notifications
   - Compliance reporting

3. **Nice to Have**:
   - Configurable expiration periods per course
   - Granular update detection (content-only vs quiz-only)
   - Supervisor approval for re-completions
   - Advanced reporting and analytics
