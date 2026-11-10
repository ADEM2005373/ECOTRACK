import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class S3StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private localUploadDir: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'ecotrack-media';
    this.localUploadDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');

    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }

    // Initialisation du client AWS SDK v3 (Compatible MinIO & AWS S3)
    try {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'eu-west-1',
        endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
        forcePathStyle: true, // Requis pour MinIO
        credentials: {
          accessKeyId: process.env.MINIO_ROOT_USER || 'ecotrack_minio',
          secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'EcoTrackMinio2026!'
        }
      });
    } catch (e) {
      console.warn('[S3] Initialisation S3 Client échouée, fallback local actif.', e);
    }
  }

  /**
   * Upload vers MinIO S3 via PutObjectCommand (ou fallback local)
   */
  async uploadMedia(cleanBuffer: Buffer, aiBuffer: Buffer): Promise<{ mediaId: string; cleanUrl: string; aiThumbnailUrl: string }> {
    const mediaId = crypto.randomUUID();
    const cleanFileName = `reports/${mediaId}.webp`;
    const aiFileName = `thumbnails/${mediaId}-ai-224.jpg`;

    // 1. Sauvegarde locale de sécurité
    const localCleanPath = path.join(this.localUploadDir, `${mediaId}.webp`);
    const localAiPath = path.join(this.localUploadDir, `${mediaId}-ai-224.jpg`);
    await fs.promises.writeFile(localCleanPath, cleanBuffer);
    await fs.promises.writeFile(localAiPath, aiBuffer);

    // 2. Upload S3 / MinIO via AWS SDK v3 PutObjectCommand
    if (this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: cleanFileName,
            Body: cleanBuffer,
            ContentType: 'image/webp',
            Metadata: {
              'x-amz-meta-sanitized': 'true',
              'x-amz-meta-rgpd-compliant': 'true'
            }
          })
        );

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: aiFileName,
            Body: aiBuffer,
            ContentType: 'image/jpeg'
          })
        );
      } catch (err) {
        console.warn('[S3-UPLOAD-NOTICE] MinIO S3 non joignable immédiatement, persistance locale garantie.', err);
      }
    }

    return {
      mediaId,
      cleanUrl: `/storage/${this.bucketName}/${cleanFileName}`,
      aiThumbnailUrl: `/storage/${this.bucketName}/${aiFileName}`
    };
  }
}

export const s3StorageService = new S3StorageService();
