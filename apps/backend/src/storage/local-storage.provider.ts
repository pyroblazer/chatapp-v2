import * as fs from 'fs/promises';
import * as path from 'path';

export class LocalStorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir =
      process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'uploads');
    this.baseUrl =
      process.env.LOCAL_STORAGE_BASE_URL || '/api/storage/local';
  }

  private resolvePath(bucket: string, key: string): string {
    return path.join(this.uploadDir, bucket, key);
  }

  private metaPath(bucket: string, key: string): string {
    return this.resolvePath(bucket, key) + '.meta';
  }

  async write(
    bucket: string,
    key: string,
    data: Buffer,
    mimeType?: string,
  ): Promise<void> {
    const filePath = this.resolvePath(bucket, key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);

    if (mimeType) {
      await fs.writeFile(this.metaPath(bucket, key), JSON.stringify({ mimeType }));
    }
  }

  async read(bucket: string, key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.resolvePath(bucket, key));
    } catch {
      return null;
    }
  }

  async delete(bucket: string, key: string): Promise<void> {
    const filePath = this.resolvePath(bucket, key);
    const metaPath = this.metaPath(bucket, key);

    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist, that's OK
    }

    try {
      await fs.unlink(metaPath);
    } catch {
      // Meta may not exist, that's OK
    }
  }

  async exists(bucket: string, key: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(bucket, key));
      return true;
    } catch {
      return false;
    }
  }

  getUrl(bucket: string, key: string): string {
    return `${this.baseUrl}/${bucket}/${key}`;
  }

  async getMeta(
    bucket: string,
    key: string,
  ): Promise<{ mimeType: string } | null> {
    try {
      const raw = await fs.readFile(this.metaPath(bucket, key), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getFilePath(bucket: string, key: string): string {
    return this.resolvePath(bucket, key);
  }
}
