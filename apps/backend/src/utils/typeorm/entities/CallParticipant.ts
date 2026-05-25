import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

export type CallParticipantStatus = 'invited' | 'ringing' | 'accepted' | 'rejected' | 'missed' | 'left';

@Entity({ name: 'call_participants' })
export class CallParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'call_id' })
  callId: string;

  @ManyToOne(() => require('./Call').Call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'call_id' })
  call: any;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => require('./User').User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({
    type: 'enum',
    enum: ['invited', 'ringing', 'accepted', 'rejected', 'missed', 'left'],
    default: 'invited',
  })
  status: CallParticipantStatus;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
