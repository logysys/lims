import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SampleTest } from './entities/sample-test.entity';
import { TestMethod } from './entities/test-method.entity';
import { AuditService } from '@modules/audit/audit.service';
import { AuditAction } from '@common/enums';
import { EnterResultsDto } from './dto/enter-results.dto';

@Injectable()
export class TestingService {
  private readonly logger = new Logger(TestingService.name);

  constructor(
    @InjectRepository(SampleTest)
    private readonly sampleTestRepository: Repository<SampleTest>,
    @InjectRepository(TestMethod)
    private readonly testMethodRepository: Repository<TestMethod>,
    private readonly auditService: AuditService,
  ) {}

  // ============================================
  // TEST METHODS (ISO 17025)
  // ============================================

  async findAllMethods() {
    return this.testMethodRepository.find({
      where: { isCurrent: true },
      order: { methodCode: 'ASC' },
    });
  }

  async findMethodById(id: string) {
    return this.testMethodRepository.findOne({ where: { id } });
  }

  async findMethodsByCategory(category: string) {
    return this.testMethodRepository.find({
      where: { category, isCurrent: true },
      order: { methodCode: 'ASC' },
    });
  }

  async findMethodsByInstrumentType(instrumentType: string) {
    return this.testMethodRepository.find({
      where: { instrumentType, isCurrent: true },
      order: { methodCode: 'ASC' },
    });
  }

  // ============================================
  // TEST QUEUE (Analyst Workflow)
  // ============================================

  async getPendingTests(userId: string) {
    return this.sampleTestRepository
      .createQueryBuilder('test')
      .leftJoinAndSelect('test.sample', 'sample')
      .leftJoinAndSelect('sample.product', 'product')
      .leftJoinAndSelect('sample.batch', 'batch')
      .leftJoinAndSelect('test.method', 'method')
      .where('test.status = :status', { status: 'pending' })
      .orderBy('batch.priority', 'DESC')
      .addOrderBy('sample.createdAt', 'ASC')
      .getMany();
  }

  async getRunningTests(userId: string) {
    return this.sampleTestRepository
      .createQueryBuilder('test')
      .leftJoinAndSelect('test.sample', 'sample')
      .leftJoinAndSelect('sample.product', 'product')
      .leftJoinAndSelect('test.method', 'method')
      .where('test.status = :status', { status: 'running' })
      .orderBy('test.startedAt', 'ASC')
      .getMany();
  }

  async getCompletedTests(userId: string) {
    return this.sampleTestRepository
      .createQueryBuilder('test')
      .leftJoinAndSelect('test.sample', 'sample')
      .leftJoinAndSelect('sample.product', 'product')
      .leftJoinAndSelect('test.method', 'method')
      .where('test.status = :status', { status: 'completed' })
      .orderBy('test.completedAt', 'DESC')
      .take(100)
      .getMany();
  }

  // ============================================
  // TEST DETAILS
  // ============================================

  async getTestById(id: string) {
    const test = await this.sampleTestRepository.findOne({
      where: { id },
      relations: [
        'sample',
        'sample.product',
        'sample.batch',
        'method',
        'reviewer',
      ],
    });

    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }

    return test;
  }

  async getTestsBySample(sampleId: string) {
    return this.sampleTestRepository.find({
      where: { sampleId },
      relations: ['method', 'reviewer'],
      order: { testOrder: 'ASC' },
    });
  }

  // ============================================
  // TEST LIFECYCLE: START
  // ============================================

  async startTest(testId: string, instrumentId: string, userId: string) {
    const test = await this.getTestById(testId);

    if (test.status !== 'pending') {
      throw new BadRequestException(
        `Cannot start test: current status is "${test.status}", expected "pending"`,
      );
    }

    if (!instrumentId) {
      throw new BadRequestException('Instrument ID is required to start a test');
    }

    await this.sampleTestRepository.update(testId, {
      status: 'running',
      instrumentId,
      startedAt: new Date(),
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'sample_test',
      resourceId: testId,
      oldValues: { status: test.status },
      newValues: { status: 'running', instrumentId },
    });

    this.logger.log(
      `Test ${testId} started on instrument ${instrumentId} by user ${userId}`,
    );

    return this.getTestById(testId);
  }

  // ============================================
  // TEST LIFECYCLE: ENTER RESULTS
  // ============================================

  async enterResults(testId: string, dto: EnterResultsDto, userId: string) {
    const test = await this.getTestById(testId);

    if (test.status !== 'running' && test.status !== 'pending') {
      throw new BadRequestException(
        `Cannot enter results: test status is "${test.status}"`,
      );
    }

    if (!dto.results || dto.results.length === 0) {
      throw new BadRequestException('At least one result entry is required');
    }

    // For simplicity, use the first result entry as the primary result
    const firstResult = dto.results[0];

    // Determine result value type
    const resultValue =
      typeof firstResult.resultValue === 'number'
        ? firstResult.resultValue
        : null;

    const resultText =
      typeof firstResult.resultValue === 'string'
        ? firstResult.resultValue
        : null;

    // Evaluate against acceptance criteria
    const resultStatus = this.evaluateResult(test, resultValue);

    // FIX: Convert null -> undefined when updating (TypeORM QueryDeepPartialEntity
    // does not accept null for optional columns)
    await this.sampleTestRepository.update(testId, {
      resultValue: resultValue ?? undefined,
      resultText: resultText ?? undefined,
      resultUnit: firstResult.unit ?? undefined,
      resultStatus,
      status: 'completed',
      completedAt: new Date(),
      notes: firstResult.notes ?? test.notes ?? undefined,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'sample_test',
      resourceId: testId,
      oldValues: {
        status: test.status,
        resultValue: test.resultValue,
        resultStatus: test.resultStatus,
      },
      newValues: {
        status: 'completed',
        resultValue,
        resultText,
        resultUnit: firstResult.unit,
        resultStatus,
      },
    });

    this.logger.log(
      `Results entered for test ${testId} by user ${userId}: status=${resultStatus}`,
    );

    return this.getTestById(testId);
  }

  // ============================================
  // RESULT EVALUATION (Acceptance Criteria)
  // ============================================

  /**
   * Evaluates a numeric result against the test method's acceptance criteria.
   * Returns 'pass', 'fail', or 'pending' if no criteria are defined.
   */
  private evaluateResult(
    test: SampleTest,
    resultValue: number | null,
  ): string {
    // If no numeric value, mark as pending review (for text-based results)
    if (resultValue === null || resultValue === undefined) {
      return 'pending';
    }

    // If no acceptance criteria defined, default to pass
    const criteria = test.method?.acceptanceCriteria as
      | { min?: number; max?: number; target?: number; tolerance?: number }
      | undefined;

    if (!criteria) {
      return 'pass';
    }

    // Range check (min/max)
    if (criteria.min !== undefined && resultValue < criteria.min) {
      return 'fail';
    }
    if (criteria.max !== undefined && resultValue > criteria.max) {
      return 'fail';
    }

    // Target + tolerance check
    if (criteria.target !== undefined && criteria.tolerance !== undefined) {
      const lower = criteria.target - criteria.tolerance;
      const upper = criteria.target + criteria.tolerance;
      if (resultValue < lower || resultValue > upper) {
        return 'fail';
      }
    }

    return 'pass';
  }

  // ============================================
  // TEST LIFECYCLE: VERIFY RESULTS (QA / Analyst Review)
  // ============================================

  async verifyResult(
    testId: string,
    decision: string,
    comment: string,
    userId: string,
  ) {
    const test = await this.getTestById(testId);

    if (test.status !== 'completed') {
      throw new BadRequestException(
        `Cannot verify: test status is "${test.status}", expected "completed"`,
      );
    }

    const validDecisions = ['accept', 'reject', 'flag'];
    if (!validDecisions.includes(decision)) {
      throw new BadRequestException(
        `Invalid decision "${decision}". Must be one of: ${validDecisions.join(', ')}`,
      );
    }

    // For reject/flag, a comment is required
    if ((decision === 'reject' || decision === 'flag') && !comment) {
      throw new BadRequestException(
        `A comment is required when decision is "${decision}"`,
      );
    }

    let newStatus: string;
    switch (decision) {
      case 'accept':
        newStatus = 'verified';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'flag':
        newStatus = 'flagged';
        break;
      default:
        newStatus = 'verified';
    }

    // Append review comment to notes
    const updatedNotes = comment
      ? `${test.notes ? test.notes + '\n\n' : ''}[Review by ${userId} on ${new Date().toISOString()}] ${comment}`
      : test.notes ?? undefined;

    await this.sampleTestRepository.update(testId, {
      status: newStatus,
      reviewedBy: userId,
      reviewedAt: new Date(),
      notes: updatedNotes,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'sample_test',
      resourceId: testId,
      oldValues: { status: test.status },
      newValues: { status: newStatus, decision, comment },
    });

    this.logger.log(
      `Test ${testId} verified with decision "${decision}" by user ${userId}`,
    );

    return this.getTestById(testId);
  }

  // ============================================
  // TEST LIFECYCLE: RETEST
  // ============================================

  async createRetest(testId: string, userId: string) {
    const test = await this.getTestById(testId);

    if (test.status !== 'rejected' && test.status !== 'flagged') {
      throw new BadRequestException(
        `Cannot retest: test status is "${test.status}", expected "rejected" or "flagged"`,
      );
    }

    const retest = this.sampleTestRepository.create({
      sampleId: test.sampleId,
      methodId: test.methodId,
      status: 'pending',
      testOrder: (test.testOrder ?? 0) + 1,
      notes: `Retest of test ${testId} (original status: ${test.status})`,
    });

    const saved = await this.sampleTestRepository.save(retest);

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      resourceType: 'sample_test',
      resourceId: saved.id,
      newValues: {
        retestOf: testId,
        sampleId: test.sampleId,
        methodId: test.methodId,
      },
    });

    this.logger.log(`Retest created: ${saved.id} (original: ${testId})`);

    return this.getTestById(saved.id);
  }

  // ============================================
  // INSTRUMENT FILE IMPORT (Raw Data Parsing)
  // ============================================

  /**
   * Placeholder for importing raw instrument data files.
   * In production this would parse HPLC/GC-MS/ICP-MS output formats.
   */
  async importInstrumentFile(
    testId: string,
    fileBuffer: Buffer,
    fileName: string,
    userId: string,
  ) {
    const test = await this.getTestById(testId);

    if (!test) {
      throw new NotFoundException(`Test with ID ${testId} not found`);
    }

    // TODO: Implement parser dispatch based on instrument type
    // const parser = this.parserRegistry.get(test.instrument?.type);
    // const parsed = await parser.parse(fileBuffer);

    this.logger.log(
      `Instrument file "${fileName}" (${fileBuffer.length} bytes) imported for test ${testId} by user ${userId}`,
    );

    return {
      testId,
      fileName,
      size: fileBuffer.length,
      importedAt: new Date().toISOString(),
      status: 'parsed',
    };
  }

  // ============================================
  // STATISTICS / DASHBOARD
  // ============================================

  async getTestingStats() {
    const [pending, running, completed, verified, rejected] =
      await Promise.all([
        this.sampleTestRepository.count({ where: { status: 'pending' } }),
        this.sampleTestRepository.count({ where: { status: 'running' } }),
        this.sampleTestRepository.count({ where: { status: 'completed' } }),
        this.sampleTestRepository.count({ where: { status: 'verified' } }),
        this.sampleTestRepository.count({ where: { status: 'rejected' } }),
      ]);

    const total = pending + running + completed + verified + rejected;

    return {
      pending,
      running,
      completed,
      verified,
      rejected,
      total,
      completedToday: await this.sampleTestRepository
        .createQueryBuilder('test')
        .where('DATE(test.completedAt) = CURRENT_DATE')
        .getCount(),
    };
  }

  // ============================================
  // OUT-OF-SPEC / QC HELPERS
  // ============================================

  async getOutOfSpecTests() {
    return this.sampleTestRepository.find({
      where: { resultStatus: 'fail' },
      relations: ['sample', 'sample.product', 'method'],
      order: { completedAt: 'DESC' },
      take: 100,
    });
  }

  async getTestsAwaitingReview() {
    return this.sampleTestRepository.find({
      where: { status: 'completed' },
      relations: ['sample', 'sample.product', 'method'],
      order: { completedAt: 'ASC' },
    });
  }
}