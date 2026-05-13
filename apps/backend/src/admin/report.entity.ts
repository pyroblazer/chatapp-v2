import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../utils/typeorm';

@Entity({ name: 'reports' })
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => User)
  reporter: User;

  @Column({ name: 'reported_user_id', nullable: true })
  reportedUserId: string;

  @ManyToOne(() => User)
  reportedUser: User;

  @Column({ name: 'message_id', nullable: true })
  messageId: string;

  @Column()
  reason: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
