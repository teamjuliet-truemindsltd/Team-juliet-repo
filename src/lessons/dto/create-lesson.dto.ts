import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '../entities/lesson.entity';

export class CreateLessonDto {
  @ApiProperty({ example: 'Setting up TypeORM and MySQL', description: 'The title of the lesson' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'https://youtube.com/watch?v=sample', description: 'External URL pointing to the actual lesson content (e.g. video link, PDF link)' })
  @IsString()
  @IsNotEmpty()
  contentUrl: string;

  @ApiProperty({ enum: ContentType, example: ContentType.VIDEO, description: 'The type of content being linked', required: false })
  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @ApiProperty({ example: 1, description: 'Order sequence of the lesson within the module', required: false })
  @IsNumber()
  @IsOptional()
  order?: number;
}
