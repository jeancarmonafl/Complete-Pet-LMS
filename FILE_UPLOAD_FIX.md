# File Upload Fix for Course Creation

## Problem

When creating a course and selecting a file, the error occurred:

```
TypeError: Cannot read properties of undefined (reading 'name')
```

And the file wasn't being uploaded:

```
contentFile: FileList {length: 0}
No file provided
contentUrl: undefined
```

## Root Cause

The issue was caused by mixing react-hook-form's `{...register('contentFile')}` with a custom `onChange` handler. This created a conflict where:

1. react-hook-form's onChange wasn't being called
2. The file wasn't being properly registered in the form state
3. The FileList was empty when the form was submitted

## Solution

### 1. Fixed File Input Registration

Changed from spreading the entire registration:

```tsx
{...register('contentFile')}
onChange={handleFileChange}
```

To manually calling each registration handler:

```tsx
onChange={(e) => {
  const registration = register('contentFile');
  registration.onChange(e);  // Call react-hook-form's handler first
  handleFileChange(e);       // Then call our custom handler
}}
onBlur={register('contentFile').onBlur}
name={register('contentFile').name}
ref={register('contentFile').ref}
```

### 2. Added File Reference

Created a `useRef` to store the selected file as a backup:

```tsx
const selectedFileRef = useRef<File | null>(null);
```

### 3. Updated handleFileChange

Enhanced to store the file in both the ref and form state:

```tsx
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;

  if (files && files.length > 0 && files[0]) {
    const file = files[0];
    setFileName(file.name);
    selectedFileRef.current = file; // Store in ref
    setValue("contentFile", files); // Store in form
    console.log("File selected:", file.name);
  } else {
    setFileName("");
    selectedFileRef.current = null;
    setValue("contentFile", undefined);
  }
};
```

### 4. Updated handleCreate

Modified to use the ref as a fallback:

```tsx
const fileToUpload = data.contentFile?.[0] || selectedFileRef.current;

if (fileToUpload) {
  contentUrl = await uploadCourseContent(fileToUpload);
}
```

### 5. Cleanup

Clear the ref when modal closes or after successful creation.

## Testing

After these changes, you should see in the console:

1. When selecting a file:

   ```
   File selected: video.mp4 Size: 1234567 Type: video/mp4
   File stored in ref: File {name: "video.mp4", ...}
   ```

2. When creating the course:

   ```
   File found, uploading: video.mp4
   Uploading file: video.mp4 1234567 video/mp4
   Upload response: {url: '/uploads/...'}
   Course payload: {...contentUrl: '/uploads/...'}
   ```

3. When opening the training:
   ```
   Training data in modal: {...contentType: 'video', contentUrl: '/uploads/...', hasVideoContent: true}
   ```

## Files Modified

- `frontend/src/pages/management/CourseManagementPage.tsx`
  - Fixed file input registration (both create and edit modals)
  - Added file ref storage
  - Enhanced error logging

## Next Steps

1. Test file upload with a small video file
2. Verify the file persists in development
3. For production, implement cloud storage (Cloudinary or S3)
