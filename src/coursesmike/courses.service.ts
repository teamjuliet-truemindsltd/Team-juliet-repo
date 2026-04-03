import { Injectable } from '@nestjs/common';
import { Course } from './course.entity';

@Injectable()
export class CoursesService {
  private courses: Course[] = [
    new Course(1, 'NestJS Basics', 'Learn the fundamentals of NestJS'),
    new Course(2, 'TypeScript Mastery', 'Deep dive into TypeScript features'),
    new Course(3, 'Database Essentials', 'Understand SQL & NoSQL databases'),
  ];

  // Browse all courses
  findAll(): Course[] {
    return this.courses;
  }

  // Find course by ID
  findOne(id: number): Course | undefined{
    return this.courses.find(course => course.id === id);
  }

  // Enroll user in a course
  enroll(courseId: number, userId: number): string {
    const course = this.findOne(courseId);
    if (!course) return 'Course not found';

    if (!course.enrolledUsers.includes(userId)) {
      course.enrolledUsers.push(userId);
      return `User ${userId} enrolled in ${course.title}`;
    }
    return `User ${userId} is already enrolled in ${course.title}`;
  }

  // Get courses a user has access to
  getUserCourses(userId: number): Course[] {
    return this.courses.filter(course =>
      course.enrolledUsers.includes(userId),
    );
  }

  // courses.service.ts
getCourseEnrolledUsers(courseId: number): number[] {
  const course = this.findOne(courseId);
  return course ? course.enrolledUsers : [];
}

}
