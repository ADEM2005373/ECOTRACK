import sharp from 'sharp';

export interface ProcessedMedia {
  cleanBuffer: Buffer;
  aiThumbnailBuffer: Buffer;
  width: number;
  height: number;
  format: string;
  metadataPurged: boolean;
}

export class ImageProcessorService {
  /**
   * Purge toutes les métadonnées sensibles (EXIF, coordonnées GPS, date/heure appareil)
   * et génère un format WebP haute performance + une vignette 224x224 pour l'IA Vision.
   * Conforme RGPD et CDCF V2 (Sprint 2 - SCRUM-47 / ECO-21).
   */
  async processCitizenPhoto(inputBuffer: Buffer): Promise<ProcessedMedia> {
    // 1. Analyse des dimensions initiales
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    // 2. Traitement Image Propre :
    // - .rotate() applique la bonne orientation basée sur l'EXIF avant de le supprimer
    // - .withMetadata(false) supprime TOUT tag EXIF, GPS, IPTC, XMP
    // - .webp({ quality: 80 }) compression optimisée pour le stockage et l'affichage web/mobile
    const cleanBuffer = await sharp(inputBuffer)
      .rotate()
      .withMetadata(false)
      .webp({ quality: 82 })
      .toBuffer();

    // 3. Traitement Vignette IA (224x224 RGB) pour le modèle MobileNetV3 / FastAPI
    const aiThumbnailBuffer = await sharp(cleanBuffer)
      .resize(224, 224, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      cleanBuffer,
      aiThumbnailBuffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: 'webp',
      metadataPurged: true
    };
  }
}

export const imageProcessorService = new ImageProcessorService();
