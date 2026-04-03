import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class SendDirectMessageDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  recipientId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;
}