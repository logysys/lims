import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  BulkSubmissionService,
  ValidationReport,
  BatchCreationResult,
} from './bulk-submission.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole, PriorityLevel } from '@common/enums';
import { BulkUploadDto } from './dto/bulk-upload.dto';

@ApiTags('Bulk Submission')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANUFACTURER, UserRole.LAB_ADMIN)
@Controller('bulk-submission')
export class BulkSubmissionController {
  constructor(private readonly bulkService: BulkSubmissionService) {}

  // --------------------------------------------------------------
  // Template download
  // --------------------------------------------------------------

  @Get('template')
  @ApiOperation({ summary: 'Download CSV template' })
  async downloadTemplateCSV(@Res() res: Response) {
    const csv = this.bulkService.getTemplateCSV();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="tru-source-bulk-template.csv"',
    });
    res.send(csv);
  }

  @Get('template/xlsx')
  @ApiOperation({ summary: 'Download XLSX template' })
  async downloadTemplateXLSX(@Res() res: Response) {
    const buffer = this.bulkService.generateTemplateXLSX();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="tru-source-bulk-template.xlsx"',
    });
    res.send(buffer);
  }

  // --------------------------------------------------------------
  // Parse uploaded file
  // --------------------------------------------------------------

  @Post('parse')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Parse uploaded CSV/XLSX file' })
  async parseFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.bulkService.parseFile(file.buffer, file.originalname, file.mimetype);
  }

  // --------------------------------------------------------------
  // Validate parsed rows
  // --------------------------------------------------------------

  @Post('validate')
  @ApiOperation({ summary: 'Validate parsed rows against the mapping' })
  async validate(@Body() dto: BulkUploadDto): Promise<ValidationReport> {
    return this.bulkService.validateRows(dto.rows, dto.columnMapping as any, {
      dateFormat: dto.dateFormat,
    });
  }

  // --------------------------------------------------------------
  // Submit validated rows → creates the batch
  // --------------------------------------------------------------

  @Post('submit')
  @ApiOperation({
    summary: 'Submit validated rows and create a sample batch',
  })
  async submit(
    @Body()
    body: {
      rows: any[];
      columnMapping: Record<string, string>;
      purchaseOrder?: string;
      dueDate?: string;
      priority?: PriorityLevel;
      notes?: string;
    },
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<{ report: ValidationReport; result?: BatchCreationResult }> {
    return this.bulkService.validateAndSubmit(
      body.rows,
      body.columnMapping,
      {
        customerId: orgId,
        userId,
        purchaseOrder: body.purchaseOrder,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        priority: body.priority,
        notes: body.notes,
      },
    );
  }

  // --------------------------------------------------------------
  // Batch summary
  // --------------------------------------------------------------

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Get summary of a bulk-submitted batch' })
  async getBatch(@Param('batchId') batchId: string) {
    return this.bulkService.getBatchSummary(batchId);
  }
}