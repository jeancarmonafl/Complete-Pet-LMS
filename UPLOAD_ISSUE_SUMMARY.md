# Video Upload Issue Fix Summary

## Problem
Videos weren't displaying in the training modal because `content_url` was `null` in the database.

## Root Causes Identified

1. **Frontend-Backend Field Mismatch**: The frontend was sending fields that didn't match the backend schema:
   - Frontend sent: `departmentScope`, `selectedDepartments`, `positionScope`, `selectedPositions`, `questions`
   - Backend expected: `assignedDepartments`, `assignedPositions`, `assignToEntireCompany`

2. **Content Type Validation**: Backend didn't accept 'powerpoint' as a valid content type (only 'video', 'pdf', 'scorm', 'other')

3. **URL Validation**: Backend schema required contentUrl to be a valid URL (`z.string().url()`), but we're using relative paths like `/uploads/file.mp4`

4. **FormData Headers**: The API client was setting 'Content-Type: application/json' which interfered with multipart/form-data uploads

5. **Vite Proxy**: In development, the `/uploads` path wasn't proxied to the backend server

## Fixes Applied

### Frontend Changes

1. **Fixed API Client** (`frontend/src/services/apiClient.ts`):
   - Added check to not override Content-Type for FormData uploads

2. **Fixed Course Creation** (`frontend/src/pages/management/CourseManagementPage.tsx`):
   - Mapped frontend fields to correct backend fields
   - Removed manual Content-Type header from upload request (let browser set boundary)
   - Added proper file handling with react-hook-form
   - Added console logging for debugging

3. **Added Vite Proxy** (`frontend/vite.config.ts`):
   - Added proxy for `/uploads` path to backend server

4. **Created Content URL Helper** (`frontend/src/utils/contentUrl.ts`):
   - Handles URL construction for both dev and production environments

5. **Updated Training Modal** (`frontend/src/components/TrainingFlowModal.tsx`):
   - Uses content URL helper for video src
   - Added debug logging

### Backend Changes

1. **Fixed Content URL Validation** (`backend/src/controllers/courseController.ts`):
   - Removed `.url()` validation to allow relative paths
   - Added 'powerpoint' to content type enum
   - Added logging for debugging

2. **Updated Upload Handler**:
   - Returns relative paths in development
   - Added console logging

## Testing Steps

1. **Restart both servers** to apply proxy changes
2. **Create a new course**:
   - Upload a video file
   - Check console for:
     - "File selected: [filename]"
     - "Uploading file: [filename]"
     - "Upload response: {url: '/uploads/...'}"
     - "Course payload to send: {...contentUrl: '/uploads/...'}"
3. **Start the training** and check console for:
   - "Converting activity record: {...content_url: '/uploads/...'}"
   - "Training data in modal: {...hasVideoContent: true}"

## Production Considerations

For production deployment on Render:
1. Ensure the `/uploads` directory persists across deployments
2. Consider using cloud storage (S3, Cloudinary) for file uploads instead of local storage
3. Update the content URL helper to handle production URLs correctly

## Remaining TODOs

1. Handle quiz questions separately (they're stored in a different table)
2. Implement proper error handling for failed uploads
3. Add upload progress indicator
4. Consider file size limits and validation
5. Implement cleanup of unused uploaded files
