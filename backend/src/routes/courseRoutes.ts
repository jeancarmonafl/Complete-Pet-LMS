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
  uploadCourseContentHandler
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
router.post('/', createCourseHandler);
router.post('/upload', upload.single('file'), uploadCourseContentHandler);
router.put('/:id', updateCourseHandler);
router.patch('/:id/status', updateCourseStatusHandler);
router.delete('/:id', deleteCourseHandler);

export default router;
