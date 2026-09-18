import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { generateApiKey, generateHash } from '@common/utils/hash.util';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async create(data: {
    organizationId: string;
    name: string;
    scopes: string[];
    expiresAt?: Date;
    ipWhitelist?: string[];
    createdBy: string;
  }) {
    const apiKey = generateApiKey();
    const hashedKey = generateHash(apiKey);

    const entity = this.apiKeyRepository.create({
      organizationId: data.organizationId,
      name: data.name,
      apiKey: apiKey.substring(0, 12) + '...', // Store prefix only for reference
      hashedKey,
      scopes: data.scopes,
      expiresAt: data.expiresAt,
      ipWhitelist: data.ipWhitelist,
      createdBy: data.createdBy,
    });

    const saved = await this.apiKeyRepository.save(entity);

    // Return the plain key ONCE
    return { ...saved, plainKey: apiKey };
  }

  async findAll(orgId: string) {
    return this.apiKeyRepository.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(id: string) {
    await this.apiKeyRepository.update(id, { status: 'revoked' });
    return this.apiKeyRepository.findOne({ where: { id } });
  }

  async validateKey(plainKey: string) {
    const hashedKey = generateHash(plainKey);
    const key = await this.apiKeyRepository.findOne({
      where: { hashedKey, status: 'active' },
    });

    if (!key) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;

    await this.apiKeyRepository.update(key.id, { lastUsedAt: new Date() });
    return key;
  }
}