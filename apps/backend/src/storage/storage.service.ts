import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { UTApi, UTFile } from 'uploadthing/server';
import sharp from 'sharp';
import { LocalStorageProvider } from './local-storage.provider';

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
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);
  private readonly utApi: UTApi;
  private readonly localStorage: LocalStorageProvider;
  private readonly defaultBucket: string;
  private readonly appId: string;
  private available = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly uploadedFiles: Map<string, string> = new Map();

  constructor() {
    const token = process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET || '';
    this.utApi = new UTApi(token ? { token } : undefined);
    this.appId = process.env.UPLOADTHING_APP_ID || '';
    this.localStorage = new LocalStorageProvider();
    this.defaultBucket = process.env.S3_BUCKET || 'chatapp-uploads';

    const intervalMs = parseInt(
      process.env.STORAGE_HEALTH_CHECK_INTERVAL || '30000',
      10,
    );
    this.healthCheckInterval = setInterval(
      () => this.checkHealth(),
      intervalMs,
    );

    this.logger.log(
      `StorageService initialized (UploadThing app: ${
        this.appId || 'not configured'
      }, bucket: ${this.defaultBucket})`,
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.checkHealth();
      if (this.available) {
        this.logger.log('UploadThing storage is available');
      }
    } catch {
      this.logger.warn(
        'UploadThing storage is unavailable — using local filesystem fallback',
      );
    }
  }

  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const result = await Promise.race([
        this.utApi.listFiles({ limit: 1 }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000),
        ),
      ]);
      this.available = !!result;
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }

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

  async uploadFile(
    bucket: string,
    key: string,
    file: Buffer | Express.Multer.File,
    metadata?: FileMetadata,
  ): Promise<void> {
    const buffer = await this.toBuffer(file);
    const mimeType =
      metadata?.['Content-Type'] || (file as Express.Multer.File).mimetype;

    this.validateFile(file, mimeType);

    const customId = `${bucket}/${key}`;

    // UploadThing upload is required — errors propagate to abort the calling operation
    const utFile = new UTFile([buffer], key, {
      type: mimeType || 'application/octet-stream',
      customId,
    });

    const result = await this.utApi.uploadFiles(utFile);

    if (result && typeof result === 'object' && 'data' in result) {
      const data = (result as any).data;
      if (data?.ufsUrl) {
        this.uploadedFiles.set(customId, data.ufsUrl);
      }
    } else if (result && typeof result === 'object' && 'ufsUrl' in result) {
      this.uploadedFiles.set(customId, (result as any).ufsUrl);
    }

    this.logger.debug(`File uploaded to UploadThing: ${customId}`);

    // Cache to local disk for fast first-display — failure here is non-fatal
    try {
      await this.localStorage.write(bucket, key, buffer, mimeType);
      this.logger.debug(`File cached locally: ${bucket}/${key}`);
    } catch (cacheErr) {
      this.logger.warn(`Local cache write failed (non-fatal): ${cacheErr.message}`);
    }
  }

  async uploadWithPreview(
    bucket: string,
    key: string,
    file: Express.Multer.File,
    metadata?: FileMetadata,
  ): Promise<{ originalKey: string; previewKey: string }> {
    const originalKey = `original/${key}`;
    const previewKey = `preview/${key}`;

    // Read the file buffer once so disk temp files are only read once then cleaned up
    const fileBuffer = await this.toBuffer(file);

    await this.uploadFile(bucket, originalKey, fileBuffer, metadata);

    const mimeType = metadata?.['Content-Type'] || file.mimetype;
    if (mimeType && mimeType.startsWith('image/')) {
      const previewBuffer = await sharp(fileBuffer)
        .resize(300)
        .jpeg({ quality: 80 })
        .toBuffer();
      await this.uploadFile(bucket, previewKey, previewBuffer, {
        'Content-Type': 'image/jpeg',
        ...metadata,
      });
    }

    // Remove temp disk file written by multer diskStorage
    const tempPath = (file as any).path || (file as any).filepath;
    if (tempPath) {
      const { unlink } = await import('fs/promises');
      await unlink(tempPath).catch(() => {});
    }

    return { originalKey, previewKey };
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    if (this.available) {
      try {
        await this.utApi.deleteFiles(key);
      } catch (error) {
        this.logger.warn(`Failed to delete from UploadThing: ${error.message}`);
      }
    }

    await this.localStorage.delete(bucket, key);
    this.uploadedFiles.delete(`${bucket}/${key}`);
    this.logger.debug(`File deleted: ${bucket}/${key}`);
  }

  async getPresignedUrl(
    bucket: string,
    key: string,
    _expirySeconds = 3600,
  ): Promise<string> {
    const customId = `${bucket}/${key}`;

    const cached = this.uploadedFiles.get(customId);
    if (cached) return cached;

    if (this.available && this.appId) {
      return `https://${this.appId}.ufs.sh/f/${customId}`;
    }

    if (await this.localStorage.exists(bucket, key)) {
      return this.localStorage.getUrl(bucket, key);
    }

    throw new NotFoundException(`File not found: ${bucket}/${key}`);
  }

  async fileExists(bucket: string, key: string): Promise<boolean> {
    if (this.available) {
      try {
        const url = `https://${this.appId}.ufs.sh/f/${bucket}/${key}`;
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) return true;
      } catch {
        // Fall through to local check
      }
    }

    return this.localStorage.exists(bucket, key);
  }

  async getFile(bucket: string, key: string): Promise<Buffer | null> {
    // Local disk cache — fast path for recently uploaded files
    const cached = await this.localStorage.read(bucket, key);
    if (cached) return cached;

    // UploadThing CDN — authoritative source for refreshes / other devices
    if (this.appId) {
      try {
        const url = `https://${this.appId}.ufs.sh/f/${bucket}/${key}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = Buffer.from(await response.arrayBuffer());
          // Re-cache locally so the next request is a fast local hit
          await this.localStorage.write(bucket, key, data).catch(() => {});
          return data;
        }
      } catch {
        // CDN unreachable — fall through to return null
      }
    }

    return null;
  }

  getDefaultBucket(): string {
    return this.defaultBucket;
  }

  private async toBuffer(file: Buffer | Express.Multer.File): Promise<Buffer> {
    if (Buffer.isBuffer(file)) return file;

    const multerFile = file as Express.Multer.File;

    // Prefer disk path (Bun's multer may use disk even when memoryStorage is set)
    const filePath = (multerFile as any).path || (multerFile as any).filepath;
    if (filePath) {
      const { readFile } = await import('fs/promises');
      return readFile(filePath);
    }

    const buf = multerFile.buffer;
    if (buf != null) {
      if (Buffer.isBuffer(buf)) return buf;
      // ArrayBuffer.isView covers Uint8Array and all other TypedArrays across realms
      if (ArrayBuffer.isView(buf)) return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
      // Blob / File (Bun native)
      if (typeof (buf as any).arrayBuffer === 'function')
        return Buffer.from(await (buf as any).arrayBuffer());
    }

    throw new Error('Multer file has no readable buffer or path');
  }
}
