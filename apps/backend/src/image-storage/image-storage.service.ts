import { Inject, Injectable } from '@nestjs/common';
import { Services } from '../utils/constants';
import { IImageStorageService } from './image-storage';
import {
  UploadGroupMessageAttachmentParams,
  UploadImageParams,
  UploadMessageAttachmentParams,
} from '../utils/types';
import { GroupMessageAttachment, MessageAttachment } from '../utils/typeorm';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ImageStorageService implements IImageStorageService {
  private readonly bucket: string;

  constructor(
    @Inject(Services.STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {
    this.bucket = this.storageService.getDefaultBucket();
  }

  async upload(params: UploadImageParams) {
    await this.storageService.uploadFile(
      this.bucket,
      params.key,
      params.file,
      { 'Content-Type': params.file.mimetype },
    );
    // Return a presigned URL instead of public-read ACL
    return this.storageService.getPresignedUrl(this.bucket, params.key);
  }

  async uploadMessageAttachment(
    params: UploadMessageAttachmentParams,
  ): Promise<MessageAttachment> {
    await this.storageService.uploadWithPreview(
      this.bucket,
      params.messageAttachment.key,
      params.file,
      { 'Content-Type': params.file.mimetype },
    );
    return params.messageAttachment;
  }

  async uploadGroupMessageAttachment(
    params: UploadGroupMessageAttachmentParams,
  ): Promise<GroupMessageAttachment> {
    await this.storageService.uploadWithPreview(
      this.bucket,
      params.messageAttachment.key,
      params.file,
      { 'Content-Type': params.file.mimetype },
    );
    return params.messageAttachment;
  }
}
