import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './utils/typeorm/entities/User';
import { Profile } from './utils/typeorm/entities/Profile';
import { UserPresence } from './utils/typeorm/entities/UserPresence';
import { Message } from './utils/typeorm/entities/Message';
import { MessageReaction } from './utils/typeorm/entities/MessageReaction';
import { MessageAttachment } from './utils/typeorm/entities/MessageAttachment';
import { Conversation } from './utils/typeorm/entities/Conversation';
import { ReadReceipt } from './utils/typeorm/entities/ReadReceipt';
import { Group } from './utils/typeorm/entities/Group';
import { GroupMessage } from './utils/typeorm/entities/GroupMessage';
import { GroupMessageReaction } from './utils/typeorm/entities/GroupMessageReaction';
import { GroupMessageAttachment } from './utils/typeorm/entities/GroupMessageAttachment';
import { FriendRequest } from './utils/typeorm/entities/FriendRequest';
import { Friend } from './utils/typeorm/entities/Friend';
import { RefreshToken } from './utils/typeorm/entities/RefreshToken';
import { Peer } from './utils/typeorm/entities/Peer';
import { Call } from './utils/typeorm/entities/Call';
import { CallParticipant } from './utils/typeorm/entities/CallParticipant';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'chat_db',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    Profile,
    UserPresence,
    Message,
    MessageReaction,
    MessageAttachment,
    Conversation,
    ReadReceipt,
    Group,
    GroupMessage,
    GroupMessageReaction,
    GroupMessageAttachment,
    FriendRequest,
    Friend,
    RefreshToken,
    Peer,
    Call,
    CallParticipant,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
