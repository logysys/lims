import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { Organization } from '@modules/organizations/entities/organization.entity';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private httpClient: AxiosInstance;

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
  ) {
    this.httpClient = axios.create({ timeout: 10000 });
  }

  async dispatchWebhook(orgId: string, event: string, payload: any) {
    const config = await this.getWebhookConfig(orgId);
    if (!config || !config.active) return;
    if (!config.events.includes(event) && !config.events.includes('*')) return;

    const signature = createHmac('sha256', config.secret)
      .update(JSON.stringify({ event, payload, timestamp: Date.now() }))
      .digest('hex');

    try {
      const res = await this.httpClient.post(
        config.url,
        {
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        },
        {
          headers: {
            'X-TruSource-Event': event,
            'X-TruSource-Signature': signature,
            'X-TruSource-Delivery': `${Date.now()}`,
          },
        },
      );
      this.logger.log(`Webhook dispatched to ${config.url}: ${res.status}`);
      return { success: true, status: res.status };
    } catch (err: any) {
      this.logger.warn(`Webhook failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  private async getWebhookConfig(orgId: string): Promise<WebhookConfig | null> {
    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    if (!org) return null;
    // In production, store in dedicated webhooks table
    const config = (org as any).webhookConfig;
    return config || null;
  }

  async syncToErp(orgId: string, system: 'sap' | 'oracle' | 'netsuite') {
    // Placeholder for ERP synchronization
    this.logger.log(`Syncing to ${system} for org ${orgId}`);
    return { success: true, system, syncedAt: new Date() };
  }

  async testWebhook(url: string, secret: string) {
    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from TruSource' },
    };

    const signature = createHmac('sha256', secret)
      .update(JSON.stringify(testPayload))
      .digest('hex');

    try {
      const res = await this.httpClient.post(url, testPayload, {
        headers: {
          'X-TruSource-Event': 'test.ping',
          'X-TruSource-Signature': signature,
        },
      });
      return { success: true, status: res.status };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}