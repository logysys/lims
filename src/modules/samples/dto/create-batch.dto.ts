import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PriorityLevel } from '@common/enums';

export class BatchSampleItemDto {
  @ApiProperty()
  @IsUUID()
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

  @ApiPropertyOptional({ type: [String] })
  @IsUUID('4', { each: true })
  @IsOptional()
  testMethodIds?: string[];
}

export class CreateBatchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchaseOrder?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ enum: PriorityLevel })
  @IsEnum(PriorityLevel)
  @IsOptional()
  priority?: PriorityLevel;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [BatchSampleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchSampleItemDto)
  samples: BatchSampleItemDto[];
}