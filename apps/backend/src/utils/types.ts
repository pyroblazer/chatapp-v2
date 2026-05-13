import type {
  Conversation,
  Friend,
  FriendRequest,
  Group,
  GroupMessage,
  GroupMessageAttachment,
  Message,
  MessageAttachment,
  User,
} from './typeorm';
import type { Request } from 'express';

export type CreateUserDetails = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type ValidateUserDetails = {
  username: string;
  password: string;
};

export type FindUserParams = Partial<{
  id: string;
  email: string;
  username: string;
}>;

export type FindUserOptions = Partial<{
  selectAll: boolean;
}>;

export type CreateConversationParams = {
  username: string;
  message: string;
};

export type ConversationIdentityType = 'author' | 'recipient';

export type FindParticipantParams = Partial<{
  id: string;
}>;

export interface AuthenticatedRequest extends Request {
  user: User;
}

export type CreateParticipantParams = {
  id: string;
};

export type CreateMessageParams = {
  id: string;
  content?: string;
  attachments?: Attachment[];
  user: User;
};

export type CreateMessageResponse = {
  message: Message;
  conversation: Conversation;
};

export type DeleteMessageParams = {
  userId: string;
  conversationId: string;
  messageId: string;
};

export type FindMessageParams = {
  userId: string;
  conversationId: string;
  messageId: string;
};

export type EditMessageParams = {
  conversationId: string;
  messageId: string;
  userId: string;
  content: string;
};

export type EditGroupMessageParams = {
  groupId: string;
  messageId: string;
  userId: string;
  content: string;
};

export type CreateGroupParams = {
  creator: User;
  title?: string;
  users: string[];
};

export type FetchGroupsParams = {
  userId: string;
};

export type CreateGroupMessageParams = {
  author: User;
  attachments?: Attachment[];
  content: string;
  groupId: string;
};

export type CreateGroupMessageResponse = {
  message: GroupMessage;
  group: Group;
};

export type DeleteGroupMessageParams = {
  userId: string;
  groupId: string;
  messageId: string;
};

export type AddGroupRecipientParams = {
  id: string;
  username: string;
  userId: string;
};

export type RemoveGroupRecipientParams = {
  id: string;
  removeUserId: string;
  issuerId: string;
};

export type AddGroupUserResponse = {
  group: Group;
  user: User;
};

export type RemoveGroupUserResponse = {
  group: Group;
  user: User;
};

export type AccessParams = {
  id: string;
  userId: string;
};

export type TransferOwnerParams = {
  userId: string;
  groupId: string;
  newOwnerId: string;
};

export type LeaveGroupParams = {
  id: string;
  userId: string;
};

export type CheckUserGroupParams = {
  id: string;
  userId: string;
};

export type CreateFriendParams = {
  user: User;
  username: string;
};

export type FriendRequestStatus = 'accepted' | 'pending' | 'rejected';

export type FriendRequestParams = {
  id: string;
  userId: string;
};

export type CancelFriendRequestParams = {
  id: string;
  userId: string;
};

export type DeleteFriendRequestParams = {
  id: string;
  userId: string;
};

export type AcceptFriendRequestResponse = {
  friend: Friend;
  friendRequest: FriendRequest;
};

export type RemoveFriendEventPayload = {
  friend: Friend;
  userId: string;
};

export type UserProfileFiles = Partial<{
  banner: Express.Multer.File[];
  avatar: Express.Multer.File[];
}>;

export type UpdateUserProfileParams = Partial<{
  about: string;
  banner: Express.Multer.File;
  avatar: Express.Multer.File;
}>;

export type ImagePermission = 'public-read' | 'private';
export type UploadImageParams = {
  key: string;
  file: Express.Multer.File;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Attachment extends Express.Multer.File {}

export type UploadMessageAttachmentParams = {
  file: Attachment;
  messageAttachment: MessageAttachment;
};

export type UploadGroupMessageAttachmentParams = {
  file: Attachment;
  messageAttachment: GroupMessageAttachment;
};

export type GetConversationMessagesParams = {
  id: string;
  limit: number;
};

export type UpdateConversationParams = Partial<{
  id: string;
  lastMessageSent: Message;
}>;

export type UserPresenceStatus = 'online' | 'away' | 'offline' | 'dnd';

export type UpdateStatusMessageParams = {
  user: User;
  statusMessage: string;
};

export type CallHangUpPayload = {
  receiver: User;
  caller: User;
};

export type VoiceCallPayload = {
  conversationId: string;
  recipientId: string;
};

export type CallAcceptedPayload = {
  caller: User;
};

export type UpdateGroupDetailsParams = {
  id: string;
  title?: string;
  avatar?: Attachment;
};
