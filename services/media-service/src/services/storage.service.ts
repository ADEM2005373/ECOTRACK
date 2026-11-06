import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Sauvegarde les fichiers nettoyés sur disque ou MinIO S3
   */
  async saveMedia(cleanBuffer: Buffer, aiBuffer: Buffer): Promise<{ mediaId: string; cleanUrl: string; aiThumbnailUrl: string }> {
    const mediaId = crypto.randomUUID();
    const cleanFileName = `${mediaId}.webp`;
    const aiFileName = `${mediaId}-ai-224.jpg`;

    const cleanFilePath = path.join(this.uploadDir, cleanFileName);
    const aiFilePath = path.join(this.uploadDir, aiFileName);

    await fs.promises.writeFile(cleanFilePath, cleanBuffer);
    await fs.promises.writeFile(aiFilePath, aiBuffer);

    return {
      mediaId,
      cleanUrl: `/uploads/${cleanFileName}`,
      aiThumbnailUrl: `/uploads/${aiFileName}`
    };
  }
}

export const storageService = new StorageService();
