import { Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { User } from './User';

@Entity()
export class Peer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => require('./User').User, (user: any) => user.peer)
  user: User;
}
