import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Enrollments & Progress')
@Controller('api/v1')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('courses/:courseId/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a specific course' })
  enroll(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.enrollmentsService.enrollUser(user.id, courseId);
  }

  @Get('users/me/enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my enrolled courses and progress' })
  getMyEnrollments(@CurrentUser() user: any) {
    return this.enrollmentsService.getUserEnrollments(user.id);
  }

  @Post('lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a lesson as complete and update progress' })
  markComplete(@Param('lessonId') lessonId: string, @CurrentUser() user: any) {
    return this.enrollmentsService.markLessonComplete(user.id, lessonId);
  }
}
