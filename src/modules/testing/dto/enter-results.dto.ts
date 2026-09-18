import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ResultEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  analyte: string;

  @ApiProperty()
  @IsNotEmpty()
  resultValue: number | string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  replicate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class EnterResultsDto {
  @ApiProperty({ type: [ResultEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultEntryDto)
  results: ResultEntryDto[];
}