import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
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

  @Column({ name: 'recipient_id', nullable: true })
  recipientId: string | null;

  @OneToOne(() => require('./User').User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'recipient_id' })
  recipient: any;

  @Column({ name: 'conversation_id', nullable: true })
  conversationId: string;

  @Column({ name: 'group_id', nullable: true })
  groupId: string;

  @ManyToOne(() => require('./Group').Group, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: any;

  @OneToMany(
    () => require('./CallParticipant').CallParticipant,
    (participant: any) => participant.call,
    { cascade: true },
  )
  participants: any[];

  @Column({ type: 'enum', enum: ['video', 'audio'], default: 'audio' })
  callType: CallType;

  @Column({ type: 'enum', enum: ['initiated', 'accepted', 'rejected', 'missed', 'ended'], default: 'initiated' })
  status: CallStatus;

  @CreateDateColumn({ name: 'initiated_at' })
  initiatedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
  durationSeconds: number | null;
}
