import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Services } from '../../utils/constants';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { StorageService } from '../../storage/storage.service';
import * as sharp from 'sharp';

export interface FileUploadJob {
  fileKey: string;
  bucket: string;
  originalName: string;
  mimeType: string;
}

export const FILE_PROCESSING_QUEUE = 'file-processing';

@Injectable()
export class FileUploadProcessor implements OnModuleInit {
  private readonly logger = new Logger(FileUploadProcessor.name);

  constructor(
    @Inject(Services.RABBITMQ_SERVICE)
    private readonly rabbitMQService: RabbitMQService,
    @Inject(Services.STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitMQService.consume(
      FILE_PROCESSING_QUEUE,
      this.process.bind(this),
    );
    this.logger.log('File upload processor started');
  }

  async process(job: FileUploadJob): Promise<void> {
    this.logger.log(
      `Processing file upload job: ${job.fileKey} (${job.mimeType})`,
    );

    const { fileKey, bucket, mimeType } = job;

    // Only generate thumbnails for image types
    if (!mimeType.startsWith('image/')) {
      this.logger.log(
        `Skipping thumbnail generation for non-image file: ${fileKey}`,
      );
      return;
    }

    // Download the original file from storage
    const fileBuffer = await this.storageService.getFile(
      bucket,
      `original/${fileKey}`,
    );
    if (!fileBuffer) {
      throw new Error(`Original file not found: original/${fileKey}`);
    }

    // Generate thumbnail (300px width, JPEG)
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(300)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload thumbnail to storage
    await this.storageService.uploadFile(
      bucket,
      `thumbnails/${fileKey}`,
      thumbnailBuffer,
      {
        'Content-Type': 'image/jpeg',
      },
    );

    this.logger.log(`Thumbnail generated for: ${fileKey}`);
  }
}
