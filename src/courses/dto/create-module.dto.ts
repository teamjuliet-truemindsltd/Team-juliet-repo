import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ example: 'Week 1: Introduction to NestJS', description: 'The title of the module/section' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 1, description: 'Order sequence of the module within the course', required: false })
  @IsNumber()
  @IsOptional()
  order?: number;
}
