import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class BulkUploadDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  rows: Record<string, any>[];

  @ApiProperty()
  @IsObject()
  columnMapping: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  skipRows?: number;

  @ApiPropertyOptional()
  @IsOptional()
  dateFormat?: string;
}