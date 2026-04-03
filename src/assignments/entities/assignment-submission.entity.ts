import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Assignment } from './assignment.entity';
import { User } from '../../users/entities/user.entity';
import { SubmissionFile } from './submission-file.entity';

@Entity('assignment_submissions')
export class AssignmentSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Assignment)
  assignment: Assignment;

  @Column()
  assignmentId: number;

  @ManyToOne(() => User)
  student: User;

  @Column()
  studentId: number;

  @Column({ type: 'datetime' })
  submittedAt: Date;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxScore: number;

  @OneToMany(() => SubmissionFile, file => file.submission)
  files: SubmissionFile[];

  @CreateDateColumn()
  createdAt: Date;
}