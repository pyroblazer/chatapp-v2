import { User } from './entities/User';
import { Conversation } from './entities/Conversation';
import { Message } from './entities/Message';
import { Group } from './entities/Group';
import { GroupMessage } from './entities/GroupMessage';
import { FriendRequest } from './entities/FriendRequest';
import { Friend } from './entities/Friend';
import { Profile } from './entities/Profile';
import { MessageAttachment } from './entities/MessageAttachment';
import { GroupMessageAttachment } from './entities/GroupMessageAttachment';
import { UserPresence } from './entities/UserPresence';
import { Peer } from './entities/Peer';
import { RefreshToken } from './entities/RefreshToken';
import { MessageReaction } from './entities/MessageReaction';
import { GroupMessageReaction } from './entities/GroupMessageReaction';
import { ReadReceipt } from './entities/ReadReceipt';
import { Call } from './entities/Call';
import { CallParticipant } from './entities/CallParticipant';
import { Notification } from '../../notifications/notification.entity';
import { Report } from '../../admin/report.entity';
import { AuditLog } from '../../audit/audit-log.entity';
import { Bot } from '../../bot/entities/bot.entity';
import { BotConversation } from '../../bot/entities/bot-conversation.entity';
import { AIMessage } from '../../bot/entities/ai-message.entity';

const entities = [
  User,
  Conversation,
  Message,
  Group,
  GroupMessage,
  FriendRequest,
  Friend,
  Profile,
  MessageAttachment,
  GroupMessageAttachment,
  UserPresence,
  Peer,
  RefreshToken,
  MessageReaction,
  GroupMessageReaction,
  ReadReceipt,
  Call,
  CallParticipant,
  Notification,
  Report,
  AuditLog,
  Bot,
  BotConversation,
  AIMessage,
];

export default entities;

export {
  User,
  Conversation,
  Message,
  Group,
  GroupMessage,
  FriendRequest,
  Friend,
  Profile,
  MessageAttachment,
  GroupMessageAttachment,
  UserPresence,
  Peer,
  RefreshToken,
  MessageReaction,
  GroupMessageReaction,
  ReadReceipt,
  Call,
  CallParticipant,
  Notification,
  Report,
  AuditLog,
  Bot,
  BotConversation,
  AIMessage,
};
