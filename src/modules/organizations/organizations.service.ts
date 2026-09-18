import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
  ) {}

  async create(data: Partial<Organization>): Promise<Organization> {
    const org = this.orgRepository.create(data);
    return this.orgRepository.save(org);
  }

  async findById(id: string): Promise<Organization | null> {
    return this.orgRepository.findOne({ where: { id } });
  }

  async findAll(options?: { page?: number; limit?: number; type?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const qb = this.orgRepository.createQueryBuilder('org');

    if (options?.type) {
      qb.andWhere('org.type = :type', { type: options.type });
    }

    qb.orderBy('org.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    await this.orgRepository.update(id, data);
    return this.findById(id) as Promise<Organization>;
  }

  async delete(id: string): Promise<void> {
    const result = await this.orgRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Organization not found');
    }
  }
}