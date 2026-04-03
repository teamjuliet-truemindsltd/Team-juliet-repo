import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GradeSubmissionDto {
  @ApiProperty()
  @IsNumber()
  score: number;

  @ApiProperty()
  @IsNumber()
  maxScore: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  feedback?: string;
}