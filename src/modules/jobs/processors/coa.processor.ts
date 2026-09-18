import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CoaService } from '@modules/coa/coa.service';

@Processor('coa-generation')
export class CoaProcessor {
  private readonly logger = new Logger(CoaProcessor.name);

  constructor(private readonly coaService: CoaService) {}

  @Process('generate-batch')
  async handleBatchGeneration(job: Job) {
    const { sampleIds, templateId, userId } = job.data;
    this.logger.log(`Generating ${sampleIds.length} COAs in background`);
    const results = await this.coaService.batchGenerate(sampleIds, templateId, userId);
    return { generated: results.length, results: results.map((r) => r.id) };
  }
}