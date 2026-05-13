import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { GroupMessage } from './GroupMessage';
import type { User } from './User';

@Entity({ name: 'groups' })
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  title: string;

  @ManyToMany(() => require('./User').User, (user: any) => user.groups)
  @JoinTable()
  users: User[];

  @OneToOne(() => require('./User').User, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  creator: User;

  @OneToOne(() => require('./User').User, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  owner: User;

  @OneToMany(
    () => require('./GroupMessage').GroupMessage,
    (message: any) => message.group,
    {
      cascade: ['insert', 'remove', 'update'],
    },
  )
  messages: GroupMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => require('./GroupMessage').GroupMessage)
  @JoinColumn({ name: 'last_message_sent' })
  lastMessageSent: GroupMessage;

  @UpdateDateColumn({ name: 'updated_at' })
  lastMessageSentAt: Date;

  @Column({ nullable: true })
  avatar: string;
}
