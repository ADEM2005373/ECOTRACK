import { Router } from 'express';
import { uploadController, uploadMiddleware } from '../controllers/upload.controller';

const router = Router();

// Route d'upload photo citoyenne
router.post('/upload', uploadMiddleware.single('photo'), (req, res) => uploadController.uploadPhoto(req, res));

export const uploadRouter = router;
