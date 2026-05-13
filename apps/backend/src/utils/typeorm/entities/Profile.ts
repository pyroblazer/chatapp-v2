import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { User } from './User';

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  about: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  banner: string;

  @OneToOne(() => require('./User').User)
  user: User;
}
