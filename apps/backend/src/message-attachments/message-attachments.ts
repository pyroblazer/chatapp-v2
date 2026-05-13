import type {
  GroupMessageAttachment,
  MessageAttachment,
} from '../utils/typeorm';
import type { Attachment } from '../utils/types';

export interface IMessageAttachmentsService {
  create(attachments: Attachment[]): Promise<MessageAttachment[]>;
  createGroupAttachments(
    attachments: Attachment[],
  ): Promise<GroupMessageAttachment[]>;
  deleteAllAttachments(attachments: MessageAttachment[]);
}
