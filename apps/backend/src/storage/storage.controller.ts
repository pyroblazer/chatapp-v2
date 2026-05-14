import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { LocalStorageProvider } from './local-storage.provider';

const localStorage = new LocalStorageProvider();

@Controller('storage')
export class StorageController {
  @Get('local/:bucket/*')
  async serveFile(
    @Param('bucket') bucket: string,
    @Param('*') key: string,
    @Res() res: Response,
  ): Promise<void> {
    const decodedKey = decodeURIComponent(key);
    const data = await localStorage.read(bucket, decodedKey);

    if (!data) {
      throw new NotFoundException(`File not found: ${bucket}/${decodedKey}`);
    }

    const meta = await localStorage.getMeta(bucket, decodedKey);
    const mimeType = meta?.mimeType || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(data);
  }
}
