import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PriorityLevel } from '@common/enums';

export class CreateSampleDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lotNumber: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  manufacturingDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  sampleWeight?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  sampleVolume?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storageCondition?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchaseOrder?: string;

  @ApiPropertyOptional({ enum: PriorityLevel })
  @IsEnum(PriorityLevel)
  @IsOptional()
  priority?: PriorityLevel;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsUUID('4', { each: true })
  @IsOptional()
  testMethodIds?: string[];
}