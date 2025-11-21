import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createCourseHandler,
  deleteCourseHandler,
  listCoursesHandler,
  updateCourseHandler,
  updateCourseStatusHandler,
  uploadCourseContentHandler,
  getQuizHandler
} from '../controllers/courseController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`.toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024
  }
});

router.use(authenticate());
router.get('/', listCoursesHandler);
router.get('/:courseId/quiz', getQuizHandler);
router.post('/', createCourseHandler);
// Support both single file upload (legacy) and multi-file upload for languages
router.post('/upload', upload.single('file'), uploadCourseContentHandler);
router.post('/upload-multi', upload.fields([
  { name: 'fileEn', maxCount: 1 },
  { name: 'fileEs', maxCount: 1 },
  { name: 'fileNe', maxCount: 1 }
]), uploadCourseContentHandler);
router.put('/:id', updateCourseHandler);
router.patch('/:id/status', updateCourseStatusHandler);
router.delete('/:id', deleteCourseHandler);

export default router;
