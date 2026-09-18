import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeListener {
  private readonly logger = new Logger(RealtimeListener.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  @OnEvent('sample.status.changed')
  handleSampleStatusChanged(payload: any) {
    this.logger.debug(`Sample ${payload.sampleId} transitioned to ${payload.toStatus}`);
    this.gateway.emitToSample(payload.sampleId, 'sample.status.changed', payload);
    this.gateway.emitToRole('qa', 'sample.status.changed', payload);
    this.gateway.emitToRole('lab_admin', 'sample.status.changed', payload);
  }

  @OnEvent('batch.created')
  handleBatchCreated(payload: any) {
    this.gateway.emitToRole('analyst', 'batch.created', {
      batchId: payload.batch.id,
      batchNumber: payload.batch.batchNumber,
    });
  }

  @OnEvent('workflow.transition')
  handleWorkflowTransition(payload: any) {
    this.gateway.emitToSample(payload.recordId, 'workflow.transition', payload);
  }

  @OnEvent('notification.created')
  handleNotification(payload: any) {
    this.gateway.emitToUser(payload.userId, 'notification', payload);
  }

  @OnEvent('test.completed')
  handleTestCompleted(payload: any) {
    this.gateway.emitToSample(payload.sampleId, 'test.completed', payload);
    this.gateway.emitToRole('qa', 'test.completed', payload);
  }

  @OnEvent('instrument.run.started')
  handleInstrumentRunStarted(payload: any) {
    this.gateway.emitToRole('analyst', 'instrument.run.started', payload);
    this.gateway.emitToRole('lab_admin', 'instrument.run.started', payload);
  }

  @OnEvent('inventory.low-stock')
  handleLowStock(payload: any) {
    this.gateway.emitToRole('lab_admin', 'inventory.low-stock', payload);
  }
}