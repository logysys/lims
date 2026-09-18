import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { verificationToken: token },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { resetToken: token } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    return this.findById(id) as Promise<User>;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    role?: string;
    orgId?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const qb = this.userRepository.createQueryBuilder('user');

    if (options?.role) {
      qb.andWhere('user.role = :role', { role: options.role });
    }
    if (options?.orgId) {
      qb.andWhere('user.orgId = :orgId', { orgId: options.orgId });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async delete(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }
}