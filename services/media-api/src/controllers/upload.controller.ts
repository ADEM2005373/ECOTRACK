import { Request, Response } from 'express';
import multer from 'multer';
import { processCitizenImage } from '../utils/sharp.util';
import { s3StorageService } from '../services/s3.service';

// Configuration Multer Memory Storage (Limite 10MB selon DoD)
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB strict
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('FORMAT_INVALIDE: Seules les photos JPEG, PNG et WebP sont autorisées.'));
    }
  }
});

export class UploadController {
  /**
   * POST /api/v1/media/upload
   * Contrôleur de traitement et upload d'images citoyennes (SCRUM-47 / ECO-21)
   */
  async uploadPhoto(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'FICHIER_MANQUANT',
          message: 'Veuillez fournir une photo valide dans le champ "photo".'
        });
      }

      // 1. Purge des métadonnées EXIF/GPS et redimensionnement via Sharp
      const processed = await processCitizenImage(req.file.buffer);

      // 2. Upload vers le bucket S3 / MinIO via AWS SDK v3 PutObjectCommand
      const uploadResult = await s3StorageService.uploadMedia(
        processed.cleanBuffer,
        processed.aiThumbnailBuffer
      );

      // 3. Réponse conforme
      return res.status(201).json({
        message: 'Photo assainie et téléversée avec succès',
        mediaId: uploadResult.mediaId,
        photoUrl: uploadResult.cleanUrl,
        thumbnailUrl: uploadResult.aiThumbnailUrl,
        metadataPurged: processed.metadataPurged,
        dimensions: {
          width: processed.width,
          height: processed.height
        },
        sizeBytes: processed.cleanBuffer.length,
        format: processed.format
      });

    } catch (error: any) {
      return res.status(400).json({
        error: 'TRAITEMENT_IMAGE_ECHEC',
        message: error.message || 'Erreur lors du traitement de la photo.'
      });
    }
  }
}

export const uploadController = new UploadController();
