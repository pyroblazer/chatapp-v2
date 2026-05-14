import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { User } from './User';
import type { FriendRequestStatus } from '../../types';

@Entity({ name: 'friend_requests' })
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => require('./User').User, {
    createForeignKeyConstraints: false,
  })
  sender: User;

  @ManyToOne(() => require('./User').User, {
    createForeignKeyConstraints: false,
  })
  receiver: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column('varchar')
  status: FriendRequestStatus;
}
