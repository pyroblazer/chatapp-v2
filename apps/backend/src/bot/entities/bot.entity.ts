import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../utils/typeorm/entities/User';

@Entity({ name: 'bots' })
export class Bot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  persona: string;

  @Column({ default: 'llama2' })
  model: string;

  @Column({ type: 'text', nullable: true, name: 'system_prompt' })
  systemPrompt: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  creator: User;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
