import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReportsService } from '@modules/reports/reports.service';

@Processor('reports')
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Process('export-samples')
  async handleSamplesExport(job: Job) {
    const { orgId, status } = job.data;
    this.logger.log(`Exporting samples for org ${orgId}`);
    const buffer = await this.reportsService.exportSamplesToExcel(orgId, status);
    return { size: buffer.length, generatedAt: new Date() };
  }
}