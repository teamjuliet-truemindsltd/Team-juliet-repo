import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { AssignmentSubmission } from './assignment-submission.entity';

@Entity('submission_files')
export class SubmissionFile {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AssignmentSubmission)
  submission: AssignmentSubmission;

  @Column()
  submissionId: number;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;
}