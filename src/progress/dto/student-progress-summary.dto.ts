export class StudentProgressSummaryDto {
  studentId: number;
  studentName: string;
  studentEmail: string;
  lessonsCompleted: number;
  totalLessons: number;
  assignmentsSubmitted: number;
  totalAssignments: number;
  averageScore: number;
  progressPercentage: number;
}