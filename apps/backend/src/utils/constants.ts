import { MulterField } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export enum Routes {
  AUTH = 'auth',
  USERS = 'users',
  USERS_PROFILES = 'users/profiles',
  CONVERSATIONS = 'conversations',
  MESSAGES = 'conversations/:id/messages',
  GROUPS = 'groups',
  GROUP_MESSAGES = 'groups/:id/messages',
  GROUP_RECIPIENTS = 'groups/:id/recipients',
  EXISTS = 'exists',
  FRIENDS = 'friends',
  FRIEND_REQUESTS = 'friends/requests',
  USER_PRESENCE = 'users/presence',
  REACTIONS = 'reactions',
  GROUP_REACTIONS = 'groups/:id/reactions',
  READ_RECEIPTS = 'conversations/:id/read-receipts',
  THREADS = 'threads',
  SEARCH = 'search',
  HEALTH = 'health',
  NOTIFICATIONS = 'notifications',
  ADMIN = 'admin',
  AUDIT_LOGS = 'admin/audit-logs',
  BLOCKED_USERS = 'users/blocked',
}

export enum Services {
  AUTH = 'AUTH_SERVICE',
  USERS = 'USERS_SERVICE',
  USERS_PROFILES = 'USERS_PROFILES_SERVICE',
  USER_PRESENCE = 'USER_PRESENCE_SERVICE',
  CONVERSATIONS = 'CONVERSATIONS_SERVICE',
  MESSAGES = 'MESSAGE_SERVICE',
  MESSAGE_ATTACHMENTS = 'MESSAGE_ATTACHMENTS_SERVICE',
  GATEWAY_SESSION_MANAGER = 'GATEWAY_SESSION_MANAGER',
  GROUPS = 'GROUPS_SERVICE',
  GROUP_MESSAGES = 'GROUP_MESSAGES_SERVICE',
  GROUP_RECIPIENTS = 'GROUP_RECIPIENTS_SERVICE',
  FRIENDS_SERVICE = 'FRIENDS_SERVICE',
  FRIENDS_REQUESTS_SERVICE = 'FRIEND_REQUEST_SERVICE',
  SPACES_CLIENT = 'SPACES_CLIENT',
  IMAGE_UPLOAD_SERVICE = 'IMAGE_UPLOAD_SERVICE',
  RABBITMQ_SERVICE = 'RABBITMQ_SERVICE',
  STORAGE_SERVICE = 'STORAGE_SERVICE',
  FILE_UPLOAD_PROCESSOR = 'FILE_UPLOAD_PROCESSOR',
  NOTIFICATION_PROCESSOR = 'NOTIFICATION_PROCESSOR',
  AUDIT_PROCESSOR = 'AUDIT_PROCESSOR',
  REACTIONS = 'REACTIONS_SERVICE',
  READ_RECEIPTS = 'READ_RECEIPTS_SERVICE',
  SEARCH = 'SEARCH_SERVICE',
  NOTIFICATIONS = 'NOTIFICATIONS_SERVICE',
  ADMIN = 'ADMIN_SERVICE',
  AUDIT = 'AUDIT_SERVICE',
  BLOCKED_USERS = 'BLOCKED_USERS_SERVICE',
}

export enum ServerEvents {
  FRIEND_REQUEST_ACCEPTED = 'friendrequest.accepted',
  FRIEND_REQUEST_REJECTED = 'friendrequest.rejected',
  FRIEND_REQUEST_CANCELLED = 'friendrequest.cancelled',
  FRIEND_REMOVED = 'friend.removed',
  REACTION_ADDED = 'reaction.added',
  REACTION_REMOVED = 'reaction.removed',
  MESSAGE_READ = 'message.read',
  THREAD_REPLY = 'thread.reply',
  NOTIFICATION_CREATED = 'notification.created',
}

export enum WebsocketEvents {
  FRIEND_REQUEST_ACCEPTED = 'onFriendRequestAccepted',
  FRIEND_REQUEST_REJECTED = 'onFriendRequestRejected',
  VIDEO_CALL_REJECTED = 'onVideoCallRejected',
  VOICE_CALL_ACCEPTED = 'onVoiceCallAccepted',
  VOICE_CALL_HANG_UP = 'onVoiceCallHangUp',
  VOICE_CALL_REJECTED = 'onVoiceCallRejected',
  REACTION_ADDED = 'onReactionAdd',
  REACTION_REMOVED = 'onReactionRemove',
  MESSAGE_READ = 'onMessageRead',
  THREAD_REPLY = 'onThreadReply',
  NOTIFICATION_CREATED = 'onNotification',
}

export const UserProfileFileFields: MulterField[] = [
  {
    name: 'banner',
    maxCount: 1,
  },
  {
    name: 'avatar',
    maxCount: 1,
  },
];
