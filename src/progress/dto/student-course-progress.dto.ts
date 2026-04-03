export class StudentCourseProgressDto {
  courseId: string;
  courseTitle: string;
  lessonsCompleted: number;
  totalLessons: number;
  lessonCompletionRate: number;
  assignmentsSubmitted: number;
  totalAssignments: number;
  assignmentCompletionRate: number;
  averageScore: number;
  progressPercentage: number;
}