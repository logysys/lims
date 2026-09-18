import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @Matches(/(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
  newPassword: string;
}