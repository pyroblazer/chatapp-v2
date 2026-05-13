import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user_presence' })
export class UserPresence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  statusMessage: string;

  @Column({ default: false })
  showOffline: boolean;
}
