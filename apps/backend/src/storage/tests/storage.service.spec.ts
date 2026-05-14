import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

const mockListFiles = jest.fn();
const mockUploadFiles = jest.fn();
const mockDeleteFiles = jest.fn();

jest.mock('uploadthing/server', () => ({
  UTApi: jest.fn().mockImplementation(() => ({
    listFiles: mockListFiles,
    uploadFiles: mockUploadFiles,
    deleteFiles: mockDeleteFiles,
  })),
  UTFile: jest.fn().mockImplementation((buffers, name, opts) => ({
    buffers,
    name,
    ...opts,
  })),
}));

jest.mock('sharp', () => {
  const instance = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('preview-data')),
  };
  const fn = jest.fn().mockReturnValue(instance);
  (fn as any).default = fn;
  return fn;
});

import { StorageService } from '../storage.service';
import { NotFoundException } from '@nestjs/common';

describe('StorageService', () => {
  let service: StorageService;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-service-test-'));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LOCAL_STORAGE_DIR = tmpDir;
    process.env.UPLOADTHING_APP_ID = 'testappid';
    process.env.STORAGE_HEALTH_CHECK_INTERVAL = '999999';
    service = new StorageService();
  });

  afterEach(() => {
    service.onModuleDestroy();
    delete process.env.UPLOADTHING_APP_ID;
    delete process.env.LOCAL_STORAGE_DIR;
  });

  describe('checkHealth', () => {
    it('sets available=true when UploadThing responds', async () => {
      mockListFiles.mockResolvedValueOnce({ files: [] });
      const result = await service.checkHealth();
      expect(result).toBe(true);
      expect(service.isAvailable()).toBe(true);
    });

    it('sets available=false on error', async () => {
      mockListFiles.mockRejectedValueOnce(new Error('network error'));
      const result = await service.checkHealth();
      expect(result).toBe(false);
      expect(service.isAvailable()).toBe(false);
    });

    it('sets available=false on timeout', async () => {
      mockListFiles.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 5000)),
      );
      const result = await service.checkHealth();
      expect(result).toBe(false);
    }, 10000);
  });

  describe('UploadThing available', () => {
    beforeEach(async () => {
      mockListFiles.mockResolvedValue({ files: [] });
      await service.checkHealth();
    });

    it('uploadFile uploads via UTApi', async () => {
      mockUploadFiles.mockResolvedValueOnce({ data: { ufsUrl: 'https://testappid.ufs.sh/f/bucket/file.txt' } });
      await service.uploadFile('bucket', 'file.txt', Buffer.from('data'), { 'Content-Type': 'text/plain' });
      expect(mockUploadFiles).toHaveBeenCalledTimes(1);
    });

    it('getPresignedUrl returns CDN URL when available', async () => {
      const url = await service.getPresignedUrl('bucket', 'file.txt');
      expect(url).toBe('https://testappid.ufs.sh/f/bucket/file.txt');
    });

    it('getPresignedUrl returns cached ufsUrl when available', async () => {
      mockUploadFiles.mockResolvedValueOnce({ data: { ufsUrl: 'https://custom.ufs.sh/f/bucket/cached.txt' } });
      await service.uploadFile('bucket', 'cached.txt', Buffer.from('x'), { 'Content-Type': 'text/plain' });
      const url = await service.getPresignedUrl('bucket', 'cached.txt');
      expect(url).toBe('https://custom.ufs.sh/f/bucket/cached.txt');
    });

    it('deleteFile calls UTApi.deleteFiles', async () => {
      mockDeleteFiles.mockResolvedValueOnce({});
      await service.deleteFile('bucket', 'file.txt');
      expect(mockDeleteFiles).toHaveBeenCalledWith('file.txt');
    });

    it('uploadWithPreview returns correct key paths for non-image file', async () => {
      mockUploadFiles.mockResolvedValue({ data: { ufsUrl: 'https://testappid.ufs.sh/f/bucket/key' } });
      const file = {
        buffer: Buffer.from('pdf-data'),
        mimetype: 'application/pdf',
        size: 100,
      } as Express.Multer.File;
      const result = await service.uploadWithPreview('bucket', 'doc.pdf', file);
      expect(result.originalKey).toBe('original/doc.pdf');
      expect(result.previewKey).toBe('preview/doc.pdf');
      expect(mockUploadFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe('UploadThing unavailable (fallback to local)', () => {
    beforeEach(async () => {
      mockListFiles.mockRejectedValue(new Error('down'));
      await service.checkHealth();
    });

    it('uploadFile writes to local filesystem', async () => {
      await service.uploadFile('bucket', 'fallback.txt', Buffer.from('local-data'), { 'Content-Type': 'text/plain' });
      expect(mockUploadFiles).not.toHaveBeenCalled();
      const filePath = path.join(tmpDir, 'bucket', 'fallback.txt');
      const written = await fs.readFile(filePath);
      expect(written.toString()).toBe('local-data');
    });

    it('getPresignedUrl returns local URL when file exists locally', async () => {
      await service.uploadFile('bucket', 'local-key.txt', Buffer.from('x'), { 'Content-Type': 'text/plain' });
      const url = await service.getPresignedUrl('bucket', 'local-key.txt');
      expect(url).toContain('local-key.txt');
    });

    it('getPresignedUrl throws NotFoundException when file not found anywhere', async () => {
      await expect(service.getPresignedUrl('bucket', 'ghost.txt')).rejects.toThrow(NotFoundException);
    });

    it('deleteFile deletes from local filesystem', async () => {
      await service.uploadFile('bucket', 'del-local.txt', Buffer.from('d'));
      await service.deleteFile('bucket', 'del-local.txt');
      const filePath = path.join(tmpDir, 'bucket', 'del-local.txt');
      await expect(fs.access(filePath)).rejects.toThrow();
    });
  });

  describe('fallback → recovery', () => {
    it('uploads locally when down, then to UploadThing after recovery', async () => {
      mockListFiles.mockRejectedValueOnce(new Error('down'));
      await service.checkHealth();
      await service.uploadFile('bucket', 'while-down.txt', Buffer.from('d'));
      expect(mockUploadFiles).not.toHaveBeenCalled();

      mockListFiles.mockResolvedValueOnce({ files: [] });
      await service.checkHealth();
      mockUploadFiles.mockResolvedValueOnce({ data: { ufsUrl: 'https://testappid.ufs.sh/f/bucket/after-recovery.txt' } });
      await service.uploadFile('bucket', 'after-recovery.txt', Buffer.from('r'), { 'Content-Type': 'text/plain' });
      expect(mockUploadFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation', () => {
    it('rejects files larger than 10MB', async () => {
      const bigFile = Buffer.alloc(11 * 1024 * 1024);
      await expect(service.uploadFile('bucket', 'big.bin', bigFile)).rejects.toThrow(/exceeds maximum/);
    });

    it('rejects disallowed MIME types', async () => {
      await expect(
        service.uploadFile('bucket', 'evil.exe', Buffer.from('x'), { 'Content-Type': 'application/x-msdownload' }),
      ).rejects.toThrow(/not allowed/);
    });
  });

  describe('getDefaultBucket', () => {
    it('returns default bucket name', () => {
      expect(service.getDefaultBucket()).toBe('chatapp-uploads');
    });
  });
});
