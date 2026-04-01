import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { SubmissionFile } from './entities/submission-file.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { User } from '../users/entities/user.entity';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private submissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(SubmissionFile)
    private fileRepo: Repository<SubmissionFile>,
    private outboxService: OutboxService,
  ) {}

  async create(createDto: CreateAssignmentDto, instructor: User) {
    const assignment = this.assignmentRepo.create({
      ...createDto,
      instructorId: instructor.id,
    });
    return this.assignmentRepo.save(assignment);
  }

  async findAllByCourse(courseId: number) {
    return this.assignmentRepo.find({
      where: { courseId },
      relations: ['instructor'],
      order: { dueDate: 'ASC' },
    });
  }

  async submit(assignmentId: number, student: User, files: Express.Multer.File[]) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    if (new Date() > assignment.dueDate) {
      throw new ForbiddenException('Assignment is past due date');
    }

    const submission = this.submissionRepo.create({
      assignmentId,
      studentId: student.id,
      submittedAt: new Date(),
    });
    const savedSubmission = await this.submissionRepo.save(submission);

    // Save files
    const fileEntities = files.map(file => this.fileRepo.create({
      submissionId: savedSubmission.id,
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`, // Adjust path as needed
      mimeType: file.mimetype,
      fileSize: file.size,
    }));
    await this.fileRepo.save(fileEntities);

    // Notify instructor via outbox
    await this.outboxService.add('ASSIGNMENT_SUBMITTED', {
      assignmentId,
      studentId: student.id,
      instructorId: assignment.instructorId,
    });

    return savedSubmission;
  }

  async gradeSubmission(submissionId: number, gradeDto: GradeSubmissionDto, instructor: User) {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['assignment'],
    });
    if (!submission) throw new NotFoundException('Submission not found');

    if (submission.assignment.instructorId !== instructor.id) {
      throw new ForbiddenException('Only the instructor can grade this submission');
    }

    submission.score = gradeDto.score;
    submission.maxScore = gradeDto.maxScore;
    if (gradeDto.feedback) {
      submission.feedback = gradeDto.feedback;
    }
    return this.submissionRepo.save(submission);
  }

  async findSubmissions(assignmentId: number, instructor: User) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment || assignment.instructorId !== instructor.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.submissionRepo.find({
      where: { assignmentId },
      relations: ['student', 'files'],
    });
  }
}