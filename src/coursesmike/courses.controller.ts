// courses.controller.ts
import { Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  getAllCourses() {
    return this.coursesService.findAll();
  }

  // NEW: See all users enrolled in a specific course
  @UseGuards(AuthGuard('jwt'))
@Get(':id/enrolled')
getCourseEnrolledUsers(@Param('id') id: string) {
  const users = this.coursesService.getCourseEnrolledUsers(Number(id));
  return { courseId: id, enrolledUsers: users };
}

@Get(':id')
getCourse(@Param('id') id: string) {
  return this.coursesService.findOne(Number(id));
}


  @UseGuards(AuthGuard('jwt'))
  @Post(':id/enroll')
  enrollCourse(@Param('id') id: string, @Request() req) {
    return this.coursesService.enroll(Number(id), req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/enrolled')
  getUserCourses(@Request() req) {
    return this.coursesService.getUserCourses(req.user.userId);
  }

  
}
