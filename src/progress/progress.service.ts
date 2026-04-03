import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { LessonProgress } from '../enrollments/entities/lesson-progress.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { AssignmentSubmission } from '../assignments/entities/assignment-submission.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { CoursesService } from '../courses/courses.service';
import { StudentCourseProgressDto } from './dto/student-course-progress.dto';
import { StudentProgressSummaryDto } from './dto/student-progress-summary.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(LessonProgress)
    private readonly lessonProgressRepository: Repository<LessonProgress>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private readonly submissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly coursesService: CoursesService,
  ) {}

  async getMyProgress(userId: number): Promise<StudentCourseProgressDto[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course'],
      order: { enrolledAt: 'DESC' },
    });

    return Promise.all(
      enrollments.map(enrollment =>
        this.buildCourseProgress(userId, enrollment.courseId, enrollment.course?.title),
      ),
    );
  }

  async getMyCourseProgress(userId: number, courseId: string): Promise<StudentCourseProgressDto> {
    await this.coursesService.findOne(courseId);
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, courseId },
      relations: ['course'],
    });

    if (!enrollment) {
      throw new NotFoundException('You must enroll in this course first');
    }

    return this.buildCourseProgress(userId, courseId, enrollment.course?.title);
  }

  async getCourseStudentsProgress(courseId: string): Promise<StudentProgressSummaryDto[]> {
    await this.coursesService.findOne(courseId);

    const enrollments = await this.enrollmentRepository.find({
      where: { courseId },
      relations: ['user', 'course'],
      order: { enrolledAt: 'DESC' },
    });

    return Promise.all(
      enrollments.map(async enrollment => {
        const progress = await this.buildCourseProgress(enrollment.userId, courseId, enrollment.course?.title);

        return {
          studentId: enrollment.userId,
          studentName: `${enrollment.user?.firstName ?? ''} ${enrollment.user?.lastName ?? ''}`.trim(),
          studentEmail: enrollment.user?.email ?? '',
          lessonsCompleted: progress.lessonsCompleted,
          totalLessons: progress.totalLessons,
          assignmentsSubmitted: progress.assignmentsSubmitted,
          totalAssignments: progress.totalAssignments,
          averageScore: progress.averageScore,
          progressPercentage: progress.progressPercentage,
        };
      }),
    );
  }

  async getCourseAnalytics(courseId: string) {
    await this.coursesService.findOne(courseId);

    const [enrollments, totalLessons, totalAssignments] = await Promise.all([
      this.enrollmentRepository.find({ where: { courseId }, relations: ['user'] }),
      this.lessonRepository
        .createQueryBuilder('lesson')
        .innerJoin('lesson.module', 'module')
        .where('module.courseId = :courseId', { courseId })
        .getCount(),
      this.assignmentRepository.count({ where: { courseId } }),
    ]);

    const studentProgress = await Promise.all(
      enrollments.map(enrollment => this.buildCourseProgress(enrollment.userId, courseId)),
    );

    const averageProgress = studentProgress.length
      ? Number((studentProgress.reduce((sum, current) => sum + current.progressPercentage, 0) / studentProgress.length).toFixed(2))
      : 0;

    const averageScore = studentProgress.length
      ? Number((studentProgress.reduce((sum, current) => sum + current.averageScore, 0) / studentProgress.length).toFixed(2))
      : 0;

    return {
      courseId,
      totalStudents: enrollments.length,
      totalLessons,
      totalAssignments,
      averageProgress,
      averageScore,
      students: studentProgress,
    };
  }

  private async buildCourseProgress(
    userId: number,
    courseId: string,
    courseTitle?: string,
  ): Promise<StudentCourseProgressDto> {
    const [totalLessons, lessonsCompleted, totalAssignments, assignmentsSubmitted, averageScoreRow] = await Promise.all([
      this.lessonRepository
        .createQueryBuilder('lesson')
        .innerJoin('lesson.module', 'module')
        .where('module.courseId = :courseId', { courseId })
        .getCount(),
      this.lessonProgressRepository
        .createQueryBuilder('lessonProgress')
        .innerJoin('lessonProgress.lesson', 'lesson')
        .innerJoin('lesson.module', 'module')
        .where('lessonProgress.userId = :userId', { userId })
        .andWhere('module.courseId = :courseId', { courseId })
        .andWhere('lessonProgress.isCompleted = :isCompleted', { isCompleted: true })
        .getCount(),
      this.assignmentRepository.count({ where: { courseId } }),
      this.submissionRepository
        .createQueryBuilder('submission')
        .innerJoin('submission.assignment', 'assignment')
        .where('submission.studentId = :userId', { userId })
        .andWhere('assignment.courseId = :courseId', { courseId })
        .getCount(),
      this.submissionRepository
        .createQueryBuilder('submission')
        .innerJoin('submission.assignment', 'assignment')
        .where('submission.studentId = :userId', { userId })
        .andWhere('assignment.courseId = :courseId', { courseId })
        .andWhere('submission.score IS NOT NULL')
        .andWhere('submission.maxScore IS NOT NULL')
        .select('COALESCE(AVG((submission.score / submission.maxScore) * 100), 0)', 'averageScore')
        .getRawOne<{ averageScore: string }>(),
    ]);

    const lessonCompletionRate = totalLessons > 0 ? Number(((lessonsCompleted / totalLessons) * 100).toFixed(2)) : 100;
    const assignmentCompletionRate = totalAssignments > 0 ? Number(((assignmentsSubmitted / totalAssignments) * 100).toFixed(2)) : 100;
    const averageScore = Number(parseFloat(averageScoreRow?.averageScore ?? '0').toFixed(2));
    const progressPercentage = Number(((lessonCompletionRate + assignmentCompletionRate) / 2).toFixed(2));

    return {
      courseId,
      courseTitle: courseTitle ?? 'Unknown Course',
      lessonsCompleted,
      totalLessons,
      lessonCompletionRate,
      assignmentsSubmitted,
      totalAssignments,
      assignmentCompletionRate,
      averageScore,
      progressPercentage,
    };
  }
}