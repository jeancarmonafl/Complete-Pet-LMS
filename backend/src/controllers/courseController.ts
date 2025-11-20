import { Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth.js';
import { createCourse, deleteCourse, listCourses, updateCourse, updateCourseStatus } from '../services/courseService.js';

const courseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  contentType: z.enum(['video', 'pdf', 'powerpoint', 'scorm', 'other']),
  contentUrl: z.string().optional(), // Remove URL validation - we're using relative paths
  durationMinutes: z.coerce.number().int().positive().optional(),
  passPercentage: z.coerce.number().min(1).max(100).optional(),
  isMandatory: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  assignedDepartments: z.array(z.string()).optional(),
  assignedPositions: z.array(z.string()).optional(),
  assignToEntireCompany: z.boolean().optional(),
  exceptionPositions: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export async function createCourseHandler(req: AuthenticatedRequest, res: Response) {
  console.log('Create course request body:', req.body);
  console.log('ContentUrl in request:', req.body.contentUrl);
  
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const body = courseSchema.parse(req.body);
    console.log('Parsed course body:', body);
    console.log('ContentUrl after parsing:', body.contentUrl);

    if (!['global_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const course = await createCourse({
      organizationId: req.user.organizationId,
      locationId: req.user.locationId,
      ...body
    });

    return res.status(201).json(course);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
    }

    return res.status(500).json({ message: 'Unable to create course' });
  }
}

export async function listCoursesHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const courses = await listCourses(req.user.organizationId, req.user.locationId);
  return res.json(courses);
}

export async function updateCourseHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const courseId = req.params.id;
    const body = courseSchema.partial().parse(req.body);

    if (!['global_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const course = await updateCourse(courseId, req.user.locationId, body);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.json(course);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
    }

    return res.status(500).json({ message: 'Unable to update course' });
  }
}

export async function deleteCourseHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const courseId = req.params.id;

    if (!['global_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const scopedLocationId = req.user.role === 'global_admin' ? undefined : req.user.locationId;
    const course = await deleteCourse(courseId, req.user.organizationId, scopedLocationId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.json({ message: 'Course deleted successfully', id: course.id });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete course' });
  }
}

export async function updateCourseStatusHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const courseId = req.params.id;
    const body = z.object({ isActive: z.boolean() }).parse(req.body);

    if (!['global_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const course = await updateCourseStatus(courseId, req.user.locationId, body.isActive);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.json({ message: 'Course status updated', isActive: course.is_active });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
    }

    return res.status(500).json({ message: 'Unable to update course status' });
  }
}

export function uploadCourseContentHandler(req: AuthenticatedRequest, res: Response) {
  console.log('Upload handler called');
  console.log('File:', req.file);
  console.log('Body:', req.body);
  
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!['global_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (!req.file) {
    console.error('No file in request');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const publicPath = `/uploads/${req.file.filename}`;
  
  // In development, return relative path so it works with proxy
  // In production, return full URL
  const isDevelopment = process.env.NODE_ENV === 'development';
  const url = isDevelopment ? publicPath : `${req.protocol}://${req.get('host')}${publicPath}`;
  
  return res.json({
    url,
    path: publicPath,
    mimeType: req.file.mimetype
  });
}
