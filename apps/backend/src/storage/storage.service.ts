import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import * as sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/json',
  'video/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/webm',
  'application/octet-stream',
];

export interface FileMetadata {
  [key: string]: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly minioClient: Minio.Client;
  private readonly defaultBucket: string;

  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = parseInt(process.env.MINIO_PORT || '9000', 10);
    const accessKey =
      process.env.MINIO_ACCESS_KEY ||
      process.env.MINIO_ROOT_USER ||
      'minioadmin';
    const secretKey =
      process.env.MINIO_SECRET_KEY ||
      process.env.MINIO_ROOT_PASSWORD ||
      'minioadmin';
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    this.minioClient = new Minio.Client({
      endPoint,
      port,
      accessKey,
      secretKey,
      useSSL,
    });

    this.defaultBucket = process.env.S3_BUCKET || 'chatapp-uploads';
    this.logger.log(
      `StorageService initialized with endpoint: ${endPoint}:${port}, bucket: ${this.defaultBucket}`,
    );
  }

  /**
   * Validate file before upload.
   */
  private validateFile(
    file: Buffer | Express.Multer.File,
    mimeType?: string,
  ): void {
    const size = Buffer.isBuffer(file) ? file.length : file.size;
    const type = mimeType || (file as Express.Multer.File).mimetype;

    if (size > MAX_FILE_SIZE) {
      throw new Error(
        `File size ${size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
      );
    }

    if (type && !ALLOWED_MIME_TYPES.includes(type)) {
      throw new Error(`MIME type ${type} is not allowed`);
    }
  }

  /**
   * Upload a file to MinIO.
   */
  async uploadFile(
    bucket: string,
    key: string,
    file: Buffer | Express.Multer.File,
    metadata?: FileMetadata,
  ): Promise<void> {
    const buffer = Buffer.isBuffer(file) ? file : file.buffer;
    const mimeType =
      metadata?.['Content-Type'] || (file as Express.Multer.File).mimetype;
    const size = buffer.length;

    this.validateFile(file, mimeType);

    await this.minioClient.putObject(bucket, key, buffer, size, {
      'Content-Type': mimeType || 'application/octet-stream',
      ...metadata,
    });

    this.logger.debug(`File uploaded: ${bucket}/${key} (${size} bytes)`);
  }

  /**
   * Upload with image compression (replaces the old compressImage helper).
   * Generates both original and preview/thumbnail versions.
   */
  async uploadWithPreview(
    bucket: string,
    key: string,
    file: Express.Multer.File,
    metadata?: FileMetadata,
  ): Promise<{ originalKey: string; previewKey: string }> {
    const originalKey = `original/${key}`;
    const previewKey = `preview/${key}`;

    // Upload original
    await this.uploadFile(bucket, originalKey, file, metadata);

    // Generate and upload preview (300px, JPEG)
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      const previewBuffer = await sharp(file.buffer)
        .resize(300)
        .jpeg({ quality: 80 })
        .toBuffer();
      await this.uploadFile(bucket, previewKey, previewBuffer, {
        'Content-Type': 'image/jpeg',
        ...metadata,
      });
    }

    return { originalKey, previewKey };
  }

  /**
   * Delete a file from MinIO.
   */
  async deleteFile(bucket: string, key: string): Promise<void> {
    await this.minioClient.removeObject(bucket, key);
    this.logger.debug(`File deleted: ${bucket}/${key}`);
  }

  /**
   * Generate a presigned URL for secure access.
   */
  async getPresignedUrl(
    bucket: string,
    key: string,
    expirySeconds = 3600,
  ): Promise<string> {
    const url = await this.minioClient.presignedUrl(
      'GET',
      bucket,
      key,
      expirySeconds,
    );
    return url;
  }

  /**
   * Check if a file exists in MinIO.
   */
  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a file's content as a Buffer from MinIO.
   */
  async getFile(bucket: string, key: string): Promise<Buffer | null> {
    try {
      const dataStream = await this.minioClient.getObject(bucket, key);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', (err: Error) => {
          this.logger.error(
            `Error downloading file ${bucket}/${key}: ${err.message}`,
          );
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(`File not found: ${bucket}/${key}`);
      return null;
    }
  }

  /**
   * Get the MinIO client for advanced usage.
   */
  getClient(): Minio.Client {
    return this.minioClient;
  }

  /**
   * Get the default bucket name.
   */
  getDefaultBucket(): string {
    return this.defaultBucket;
  }
}
