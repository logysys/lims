import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InventoryItem } from './entities/inventory-item.entity';
import { StorageLocation } from './entities/storage-location.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { AuditService } from '@modules/audit/audit.service';
import { AuditAction } from '@common/enums';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepository: Repository<InventoryItem>,
    @InjectRepository(StorageLocation)
    private readonly locationRepository: Repository<StorageLocation>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    private readonly auditService: AuditService,
  ) {}

  // ===== Items =====
  async createItem(data: Partial<InventoryItem>, userId: string) {
    const item = this.itemRepository.create({ ...data, createdBy: userId });
    const saved = await this.itemRepository.save(item);

    if (data.quantity && data.quantity > 0) {
      await this.movementRepository.save(
        this.movementRepository.create({
          inventoryItemId: saved.id,
          movementType: 'received',
          quantity: data.quantity,
          toLocationId: data.storageLocationId,
          performedBy: userId,
          notes: 'Initial stock',
        }),
      );
    }

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      resourceType: 'inventory_item',
      resourceId: saved.id,
      newValues: { name: saved.name, itemCode: saved.itemCode },
    });

    return saved;
  }

  async findAllItems(options: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    lowStock?: boolean;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const qb = this.itemRepository.createQueryBuilder('item');

    if (options.category) {
      qb.andWhere('item.category = :category', { category: options.category });
    }
    if (options.status) {
      qb.andWhere('item.status = :status', { status: options.status });
    }
    if (options.lowStock) {
      qb.andWhere('item.quantity <= item.minimumQuantity');
    }

    qb.orderBy('item.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async updateItem(id: string, data: Partial<InventoryItem>, userId: string) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');

    await this.itemRepository.update(id, data);

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'inventory_item',
      resourceId: id,
      oldValues: { name: item.name, quantity: item.quantity, status: item.status },
      newValues: data,
    });

    return this.itemRepository.findOne({ where: { id } });
  }

  async recordMovement(
    data: {
      inventoryItemId: string;
      movementType: string;
      quantity: number;
      fromLocationId?: string;
      toLocationId?: string;
      referenceId?: string;
      referenceType?: string;
      notes?: string;
    },
    userId: string,
  ) {
    const item = await this.itemRepository.findOne({
      where: { id: data.inventoryItemId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    let newQuantity = Number(item.quantity);

    switch (data.movementType) {
      case 'used':
      case 'disposed':
        if (newQuantity < data.quantity) {
          throw new BadRequestException('Insufficient quantity');
        }
        newQuantity -= data.quantity;
        break;
      case 'received':
        newQuantity += data.quantity;
        break;
      case 'transferred':
        // no quantity change
        break;
      default:
        throw new BadRequestException(`Unknown movement type: ${data.movementType}`);
    }

    const movement = this.movementRepository.create({
      ...data,
      performedBy: userId,
    });
    await this.movementRepository.save(movement);

    let status = item.status;
    if (newQuantity <= 0) status = 'depleted';
    else if (item.minimumQuantity && newQuantity <= item.minimumQuantity) status = 'low';

    await this.itemRepository.update(item.id, { quantity: newQuantity, status });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'inventory_movement',
      resourceId: movement.id,
      oldValues: { quantity: item.quantity, status: item.status },
      newValues: { quantity: newQuantity, status, movementType: data.movementType },
    });

    return movement;
  }

  // ===== Locations =====
  async createLocation(data: Partial<StorageLocation>) {
    const location = this.locationRepository.create(data);
    return this.locationRepository.save(location);
  }

  async getLocationTree() {
    const locations = await this.locationRepository.find({
      where: { isActive: true },
      order: { locationCode: 'ASC' },
    });

    // Build tree
    const map = new Map<string, any>();
    locations.forEach((loc) => map.set(loc.id, { ...loc, children: [] }));

    const roots: any[] = [];
    locations.forEach((loc) => {
      const node = map.get(loc.id);
      if (loc.parentLocationId && map.has(loc.parentLocationId)) {
        map.get(loc.parentLocationId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async getAllLocations() {
    return this.locationRepository.find({
      where: { isActive: true },
      order: { locationCode: 'ASC' },
    });
  }

  async getMovements(itemId?: string) {
    const qb = this.movementRepository.createQueryBuilder('movement');
    if (itemId) qb.andWhere('movement.inventoryItemId = :itemId', { itemId });
    return qb.orderBy('movement.createdAt', 'DESC').take(100).getMany();
  }

  async getLowStockAlerts() {
    return this.itemRepository
      .createQueryBuilder('item')
      .where('item.quantity <= item.minimumQuantity')
      .andWhere('item.status != :status', { status: 'disposed' })
      .orderBy('item.quantity', 'ASC')
      .getMany();
  }
}