import { Router, Request, Response } from 'express';
import multer from 'multer';
import { imageProcessorService } from '../services/image-processor.service';
import { storageService } from '../services/storage.service';
import { MediaUploadResponse } from '@ecotrack/shared';

const router = Router();

// Configuration Multer en mémoire (max 10 Mo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MiB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('FORMAT_NON_SUPPORTE: Seules les images JPEG, PNG et WebP sont autorisées.'));
    }
  }
});

/**
 * POST /api/v1/media/upload
 * Téléversement et assainissement RGPD de photos citoyennes
 * Sprint 2: SCRUM-47 / ECO-21
 */
router.post('/upload', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'FICHIER_MANQUANT',
        message: 'Le champ photo est requis dans le formulaire multipart.'
      });
    }

    // 1. Purge EXIF / GPS et génération de la vignette IA 224x224
    const processed = await imageProcessorService.processCitizenPhoto(req.file.buffer);

    // 2. Enregistrement dans le stockage persistant
    const saved = await storageService.saveMedia(processed.cleanBuffer, processed.aiThumbnailBuffer);

    const response: MediaUploadResponse = {
      mediaId: saved.mediaId,
      cleanUrl: saved.cleanUrl,
      aiThumbnailUrl: saved.aiThumbnailUrl,
      metadataPurged: true,
      dimensions: {
        width: processed.width,
        height: processed.height
      },
      sizeBytes: processed.cleanBuffer.length
    };

    return res.status(201).json(response);

  } catch (error: any) {
    return res.status(400).json({
      error: 'MEDIA_PROCESSING_ERROR',
      message: error.message || 'Erreur lors du traitement de l\'image.'
    });
  }
});

export const mediaRouter = router;
