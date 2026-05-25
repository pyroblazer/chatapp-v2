import type { GroupMessage } from '../../utils/typeorm';
import type {
  CreateGroupMessageParams,
  DeleteGroupMessageParams,
  EditGroupMessageParams,
} from '../../utils/types';

export interface IGroupMessageService {
  createGroupMessage(params: CreateGroupMessageParams);
  getGroupMessages(id: string, cursor?: string, limit?: number): Promise<GroupMessage[]>;
  deleteGroupMessage(params: DeleteGroupMessageParams);
  editGroupMessage(params: EditGroupMessageParams): Promise<GroupMessage>;
  getGroupThreadReplies(messageId: string): Promise<GroupMessage[]>;
}
