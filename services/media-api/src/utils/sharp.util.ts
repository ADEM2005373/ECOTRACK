import sharp from 'sharp';

export interface ProcessedPhotoResult {
  cleanBuffer: Buffer;
  aiThumbnailBuffer: Buffer;
  width: number;
  height: number;
  format: 'webp';
  metadataPurged: boolean;
}

/**
 * Traitement d'images citoyennes conforme au ticket SCRUM-47 (ECO-21) :
 * 1. Redimensionnement max 1920px (largeur ou hauteur) pour éviter le surdimensionnement
 * 2. Suppression stricte des métadonnées EXIF, GPS, IPTC avec .withMetadata(false)
 * 3. Compression WebP haute fidélité
 * 4. Génération d'un thumbnail normalisé 224x224 pour l'inférence IA Vision MobileNetV3
 */
export async function processCitizenImage(inputBuffer: Buffer): Promise<ProcessedPhotoResult> {
  const metadata = await sharp(inputBuffer).metadata();

  // 1. Redimensionnement max 1920px et purge EXIF/GPS
  const cleanBuffer = await sharp(inputBuffer)
    .rotate() // Applique l'orientation EXIF avant suppression des tags
    .resize(1920, 1920, {
      fit: 'inside', // Préserve le ratio d'aspect sans déformation
      withoutEnlargement: true // N'agrandit pas les petites images
    })
    .withMetadata(false) // Purge intégrale EXIF / GPS RGPD (0 métadonnée résiduelle)
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  // Re-mesure après redimensionnement
  const cleanMeta = await sharp(cleanBuffer).metadata();

  // 2. Génération du format attendu par le microservice IA Vision (224x224)
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
    width: cleanMeta.width || metadata.width || 0,
    height: cleanMeta.height || metadata.height || 0,
    format: 'webp',
    metadataPurged: true
  };
}
