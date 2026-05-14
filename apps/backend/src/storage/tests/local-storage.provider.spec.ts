import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { LocalStorageProvider } from '../local-storage.provider';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-storage-test-'));
    process.env.LOCAL_STORAGE_DIR = tmpDir;
    process.env.LOCAL_STORAGE_BASE_URL = '/api/storage/local';
    provider = new LocalStorageProvider();
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    delete process.env.LOCAL_STORAGE_DIR;
    delete process.env.LOCAL_STORAGE_BASE_URL;
  });

  describe('write + read', () => {
    it('writes file and reads it back', async () => {
      const data = Buffer.from('hello world');
      await provider.write('bucket', 'file.txt', data, 'text/plain');
      const result = await provider.read('bucket', 'file.txt');
      expect(result).toEqual(data);
    });

    it('creates nested directories for nested keys', async () => {
      const data = Buffer.from('nested content');
      await provider.write('bucket', 'original/uuid.jpg', data, 'image/jpeg');
      const result = await provider.read('bucket', 'original/uuid.jpg');
      expect(result).toEqual(data);
    });

    it('writes meta sidecar with mimeType', async () => {
      await provider.write('bucket', 'typed.txt', Buffer.from('x'), 'text/csv');
      const meta = await provider.getMeta('bucket', 'typed.txt');
      expect(meta).toEqual({ mimeType: 'text/csv' });
    });

    it('returns null for missing file', async () => {
      const result = await provider.read('bucket', 'nonexistent.txt');
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('returns true for written file', async () => {
      await provider.write('bucket', 'exists-check.txt', Buffer.from('y'));
      expect(await provider.exists('bucket', 'exists-check.txt')).toBe(true);
    });

    it('returns false for missing file', async () => {
      expect(await provider.exists('bucket', 'missing.txt')).toBe(false);
    });
  });

  describe('delete', () => {
    it('removes file and meta sidecar', async () => {
      await provider.write('bucket', 'to-delete.txt', Buffer.from('z'), 'text/plain');
      expect(await provider.exists('bucket', 'to-delete.txt')).toBe(true);
      await provider.delete('bucket', 'to-delete.txt');
      expect(await provider.exists('bucket', 'to-delete.txt')).toBe(false);
      expect(await provider.getMeta('bucket', 'to-delete.txt')).toBeNull();
    });

    it('does not throw when deleting non-existent file', async () => {
      await expect(provider.delete('bucket', 'ghost.txt')).resolves.not.toThrow();
    });
  });

  describe('getUrl', () => {
    it('generates correct URL', () => {
      expect(provider.getUrl('bucket', 'file.txt')).toBe(
        '/api/storage/local/bucket/file.txt',
      );
    });

    it('generates correct URL for nested key', () => {
      expect(provider.getUrl('bucket', 'original/uuid.jpg')).toBe(
        '/api/storage/local/bucket/original/uuid.jpg',
      );
    });
  });

  describe('getMeta', () => {
    it('returns null when meta sidecar does not exist', async () => {
      await provider.write('bucket', 'no-meta.txt', Buffer.from('data'));
      const meta = await provider.getMeta('bucket', 'no-meta.txt');
      expect(meta).toBeNull();
    });
  });

  describe('getFilePath', () => {
    it('returns absolute path to file', () => {
      const filePath = provider.getFilePath('bucket', 'file.txt');
      expect(path.isAbsolute(filePath)).toBe(true);
      expect(filePath).toContain('bucket');
      expect(filePath).toContain('file.txt');
    });
  });
});
