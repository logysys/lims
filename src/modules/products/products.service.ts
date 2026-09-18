import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(data: Partial<Product>) {
    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    manufacturerId?: string;
    category?: string;
    search?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const qb = this.productRepository.createQueryBuilder('product');

    if (options.manufacturerId) {
      qb.andWhere('product.manufacturerId = :manufacturerId', {
        manufacturerId: options.manufacturerId,
      });
    }
    if (options.category) {
      qb.andWhere('product.category = :category', { category: options.category });
    }
    if (options.search) {
      qb.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    qb.andWhere('product.isActive = :active', { active: true });
    qb.orderBy('product.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['manufacturer'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, data: Partial<Product>) {
    await this.productRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string) {
    await this.productRepository.update(id, { isActive: false });
  }
}