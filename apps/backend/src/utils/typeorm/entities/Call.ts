import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export type CallType = 'video' | 'audio';
export type CallStatus = 'initiated' | 'accepted' | 'rejected' | 'missed' | 'ended';

@Entity({ name: 'calls' })
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'caller_id' })
  callerId: string;

  @OneToOne(() => require('./User').User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'caller_id' })
  caller: any;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @OneToOne(() => require('./User').User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'recipient_id' })
  recipient: any;

  @Column({ name: 'conversation_id', nullable: true })
  conversationId: string;

  @Column({ type: 'enum', enum: ['video', 'audio'], default: 'audio' })
  callType: CallType;

  @Column({ type: 'enum', enum: ['initiated', 'accepted', 'rejected', 'missed', 'ended'], default: 'initiated' })
  status: CallStatus;

  @CreateDateColumn({ name: 'initiated_at' })
  initiatedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number | null;
}
