import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, UploadedFiles, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a new assignment' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid assignment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only instructors can create assignments' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  create(@Body() createDto: CreateAssignmentDto, @CurrentUser() user: JwtPayload) {
    return this.assignmentsService.create(createDto, user.sub);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get assignments for a course' })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findByCourse(@Param('courseId') courseId: string) {
    return this.assignmentsService.findAllByCourse(courseId);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 5 }], {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        notes: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Submit assignment with files' })
  @ApiResponse({ status: 201, description: 'Assignment submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid submission' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only students can submit' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  submit(
    @Param('id', ParseIntPipe) assignmentId: number,
    @UploadedFiles() files: { files?: Express.Multer.File[] },
    @Body() submitDto: SubmitAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.submit(assignmentId, user.sub, files.files || []);
  }

  @Get(':id/submissions')
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get submissions for an assignment' })
  @ApiResponse({ status: 200, description: 'List of submissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only instructors can view submissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  findSubmissions(@Param('id', ParseIntPipe) assignmentId: number, @CurrentUser() user: JwtPayload) {
    return this.assignmentsService.findSubmissions(assignmentId, user.sub);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Grade a submission' })
  @ApiResponse({ status: 200, description: 'Submission graded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid grade data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only instructors can grade' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  gradeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() gradeDto: GradeSubmissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, gradeDto, user.sub);
  }
}