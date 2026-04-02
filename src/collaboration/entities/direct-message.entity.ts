import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('direct_messages')
export class DirectMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @Column()
  recipientId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  recipient: User;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}