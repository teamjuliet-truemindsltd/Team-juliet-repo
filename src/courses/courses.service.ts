import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Course } from './entities/course.entity';
import { Module as CourseModule } from './entities/module.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(CourseModule)
    private moduleRepository: Repository<CourseModule>,
  ) {}

  async create(createCourseDto: CreateCourseDto, instructorId: number): Promise<Course> {
    const course = this.courseRepository.create({
      ...createCourseDto,
      instructorId,
    });
    return await this.courseRepository.save(course);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    onlyPublished: boolean = true
  ) {
    const [courses, total] = await this.courseRepository.findAndCount({
      where: {
        ...(onlyPublished ? { isPublished: true } : {}),
        ...(search ? { title: Like(`%${search}%`) } : {}),
      },
      relations: ['instructor'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['instructor', 'modules'],
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, userId: number, isAdmin: boolean): Promise<Course> {
    const course = await this.findOne(id);
    
    if (course.instructorId !== userId && !isAdmin) {
      throw new UnauthorizedException('You can only update your own courses');
    }

    Object.assign(course, updateCourseDto);
    return await this.courseRepository.save(course);
  }

  async remove(id: string, userId: number, isAdmin: boolean): Promise<void> {
    const course = await this.findOne(id);
    
    if (course.instructorId !== userId && !isAdmin) {
      throw new UnauthorizedException('You can only delete your own courses');
    }

    await this.courseRepository.remove(course);
  }

  // --- Module Methods ---

  async addModule(courseId: string, createModuleDto: CreateModuleDto, userId: number, isAdmin: boolean): Promise<CourseModule> {
    const course = await this.findOne(courseId);
    
    if (course.instructorId !== userId && !isAdmin) {
      throw new UnauthorizedException('You can only add modules to your own courses');
    }

    const module = this.moduleRepository.create({
      ...createModuleDto,
      courseId,
    });

    return await this.moduleRepository.save(module);
  }

  async getModulesForCourse(courseId: string): Promise<CourseModule[]> {
    // This verifies the course exists
    await this.findOne(courseId);
    
    return await this.moduleRepository.find({
      where: { courseId },
      order: { order: 'ASC' },
      relations: ['course'] // Inverse relation if needed
    });
  }
  
  async findModuleById(moduleId: string): Promise<CourseModule> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId }
    });
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }
}
