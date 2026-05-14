import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Group } from './Group';
import type { Message } from './Message';
import type { Peer } from './Peer';
import type { Profile } from './Profile';
import type { UserPresence } from './UserPresence';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column('varchar', { default: 'USER' })
  role: 'USER' | 'MODERATOR' | 'ADMIN';

  @Column({ default: true })
  active: boolean;

  @OneToMany(
    () => require('./Message').Message,
    (message: any) => message.author,
  )
  messages: Message[];

  @ManyToMany(() => require('./Group').Group, (group: any) => group.users)
  groups: Group[];

  @OneToOne(() => require('./Profile').Profile, {
    cascade: ['insert', 'update'],
  })
  @JoinColumn()
  profile: Profile;

  @OneToOne(() => require('./UserPresence').UserPresence, {
    cascade: ['insert', 'update'],
  })
  @JoinColumn()
  presence: UserPresence;

  @OneToOne(() => require('./Peer').Peer, (peer: any) => peer.user, {
    cascade: ['insert', 'remove', 'update'],
  })
  @JoinColumn()
  peer: Peer;

  @ManyToMany(() => require('./User').User, { cascade: false })
  @JoinTable({ name: 'user_blocked_users' })
  blockedUsers: User[];
}
