import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my progress across enrolled courses' })
  @ApiResponse({ status: 200, description: 'List of courses with progress' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only students can view own progress' })
  getMyProgress(@CurrentUser() user: JwtPayload) {
    return this.progressService.getMyProgress(user.sub);
  }

  @Get('me/course/:courseId')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my detailed progress for a course' })
  @ApiResponse({ status: 200, description: 'Detailed course progress' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only students can view own progress' })
  @ApiResponse({ status: 404, description: 'Course not found or not enrolled' })
  getMyCourseProgress(@CurrentUser() user: JwtPayload, @Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.progressService.getMyCourseProgress(user.sub, courseId);
  }

  @Get('course/:courseId/students')
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get student progress for a course' })
  @ApiResponse({ status: 200, description: 'List of student progress' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only instructors can view' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  getCourseStudentsProgress(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.progressService.getCourseStudentsProgress(courseId);
  }

  @Get('course/:courseId/analytics')
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get progress analytics for a course' })
  @ApiResponse({ status: 200, description: 'Course analytics data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only instructors can view analytics' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  getCourseAnalytics(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.progressService.getCourseAnalytics(courseId);
  }
}