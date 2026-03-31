import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Courses')
@Controller('api/v1/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (Instructor/Admin)' })
  create(@Body() createCourseDto: CreateCourseDto, @CurrentUser() user: any) {
    return this.coursesService.create(createCourseDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all published courses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.coursesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      true // Only published by default for public browsing
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a course' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.coursesService.update(id, updateCourseDto, user.id, isAdmin);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a course' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.coursesService.remove(id, user.id, isAdmin);
  }

  // --- Module Endpoints ---

  @Post(':id/modules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new module to a course' })
  addModule(
    @Param('id') id: string, 
    @Body() createModuleDto: CreateModuleDto,
    @CurrentUser() user: any
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.coursesService.addModule(id, createModuleDto, user.id, isAdmin);
  }

  @Get(':id/modules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get modules for a course. Requires Auth/Enrollment' })
  getModulesForCourse(@Param('id') id: string) {
    // Note: Enrollment checking would be done either via a Guard or within a service call logic.
    // For now, any authenticated user can view the syllabus/modules.
    return this.coursesService.getModulesForCourse(id);
  }
}
