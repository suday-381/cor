import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueLineItem } from './entities/revenue-line-item.entity';

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(RevenueLineItem)
    private readonly revenueRepository: Repository<RevenueLineItem>,
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async findAllByCycle(cycleId: string, departmentId?: string): Promise<RevenueLineItem[]> {
    if (!this.isUuid(cycleId)) {
      return [];
    }
    const whereClause: any = { cycleId };
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    return this.revenueRepository.find({
      where: whereClause,
      relations: ['department', 'account'],
      order: { productName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<RevenueLineItem> {
    const item = await this.revenueRepository.findOne({
      where: { id },
      relations: ['department', 'account'],
    });
    if (!item) {
      throw new NotFoundException(`Item target revenue dengan ID ${id} tidak ditemukan`);
    }
    return item;
  }

  async create(data: Partial<RevenueLineItem>): Promise<RevenueLineItem> {
    const item = this.revenueRepository.create(data);
    return this.revenueRepository.save(item);
  }

  async update(id: string, updates: Partial<RevenueLineItem>): Promise<RevenueLineItem> {
    const item = await this.findOne(id);
    Object.assign(item, updates);
    return this.revenueRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.revenueRepository.remove(item);
  }
}
