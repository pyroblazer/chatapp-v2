import { Controller, Get, Inject, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../utils/public.decorator';
import { Services } from '../utils/constants';
import { LocalStorageProvider } from './local-storage.provider';
import { StorageService } from './storage.service';

const localMeta = new LocalStorageProvider();

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(
    @Inject(Services.STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {}

  @Public()
  @Get('local/:bucket/*')
  @ApiOperation({ summary: 'Serve a locally stored or proxied file' })
  @ApiParam({ name: 'bucket' })
  @ApiParam({ name: '0', description: 'File path/key' })
  async serveFile(
    @Param('bucket') bucket: string,
    @Param('0') key: string,
    @Res() res: Response,
  ): Promise<void> {
    const decodedKey = decodeURIComponent(key);
    const data = await this.storageService.getFile(bucket, decodedKey);

    if (!data) {
      throw new NotFoundException(`File not found: ${bucket}/${decodedKey}`);
    }

    const meta = await localMeta.getMeta(bucket, decodedKey);
    const mimeType = meta?.mimeType || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(data);
  }
}
