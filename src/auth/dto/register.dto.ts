import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Ada' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Obi' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'ada@trueminds.io' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: [UserRole.STUDENT, UserRole.INSTRUCTOR],
    description: 'Only "student" or "instructor" are allowed during registration',
  })
  @IsEnum([UserRole.STUDENT, UserRole.INSTRUCTOR], {
    message: 'role must be either student or instructor',
  })
  role: UserRole.STUDENT | UserRole.INSTRUCTOR;
}
