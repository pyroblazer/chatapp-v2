import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LocalStorageProvider } from '../local-storage.provider';
import { StorageController } from '../storage.controller';
import { Services } from '../../utils/constants';

jest.mock('../local-storage.provider');

describe('StorageController', () => {
  let controller: StorageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: Services.STORAGE_SERVICE,
          useValue: {
            isAvailable: jest.fn().mockReturnValue(true),
            getFile: async (bucket: string, key: string) =>
              new LocalStorageProvider().read(bucket, key),
          },
        },
      ],
    }).compile();
    controller = module.get(StorageController);
  });

  function makeMockRes() {
    return {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as any;
  }

  it('serves file with correct content-type from meta', async () => {
    const data = Buffer.from('image data');
    jest
      .spyOn(LocalStorageProvider.prototype, 'read')
      .mockResolvedValueOnce(data);
    jest
      .spyOn(LocalStorageProvider.prototype, 'getMeta')
      .mockResolvedValueOnce({ mimeType: 'image/jpeg' });
    const res = makeMockRes();

    await controller.serveFile('images', 'photo.jpg', res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(res.send).toHaveBeenCalledWith(data);
  });

  it('falls back to application/octet-stream when no meta', async () => {
    jest
      .spyOn(LocalStorageProvider.prototype, 'read')
      .mockResolvedValueOnce(Buffer.from('binary'));
    jest
      .spyOn(LocalStorageProvider.prototype, 'getMeta')
      .mockResolvedValueOnce(null);
    const res = makeMockRes();

    await controller.serveFile('files', 'data.bin', res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/octet-stream',
    );
    expect(res.send).toHaveBeenCalled();
  });

  it('throws NotFoundException for missing file', async () => {
    jest
      .spyOn(LocalStorageProvider.prototype, 'read')
      .mockResolvedValueOnce(null);
    const res = makeMockRes();

    await expect(
      controller.serveFile('bucket', 'missing.txt', res),
    ).rejects.toThrow(NotFoundException);
  });

  it('handles nested key paths', async () => {
    const data = Buffer.from('nested file');
    const readSpy = jest
      .spyOn(LocalStorageProvider.prototype, 'read')
      .mockResolvedValueOnce(data);
    jest
      .spyOn(LocalStorageProvider.prototype, 'getMeta')
      .mockResolvedValueOnce({ mimeType: 'text/plain' });
    const res = makeMockRes();

    await controller.serveFile('bucket', 'original/some-uuid.jpg', res);

    expect(readSpy).toHaveBeenCalledWith('bucket', 'original/some-uuid.jpg');
    expect(res.send).toHaveBeenCalledWith(data);
  });

  it('sets cache-control header', async () => {
    jest
      .spyOn(LocalStorageProvider.prototype, 'read')
      .mockResolvedValueOnce(Buffer.from('x'));
    jest
      .spyOn(LocalStorageProvider.prototype, 'getMeta')
      .mockResolvedValueOnce(null);
    const res = makeMockRes();

    await controller.serveFile('bucket', 'file.txt', res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=86400',
    );
  });
});
