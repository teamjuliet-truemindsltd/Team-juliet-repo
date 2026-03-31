import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Advanced Full-Stack Engineering', description: 'The title of the course' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A deep dive into NestJS, React, and scalable architecture.', description: 'Detailed course description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, description: 'Whether the course is immediately visible to students upon creation. Defaults to false.', required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
