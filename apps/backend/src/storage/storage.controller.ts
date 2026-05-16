import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../utils/public.decorator';
import { LocalStorageProvider } from './local-storage.provider';

const localStorage = new LocalStorageProvider();

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  @Public()
  @Get('local/:bucket/*')
  @ApiOperation({ summary: 'Serve a locally stored file' })
  @ApiParam({ name: 'bucket' })
  @ApiParam({ name: '*', description: 'File path/key' })
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
