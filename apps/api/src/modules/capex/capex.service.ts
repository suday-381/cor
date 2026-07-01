import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CapExItem } from './entities/capex-item.entity';

@Injectable()
export class CapexService {
  constructor(
    @InjectRepository(CapExItem)
    private readonly capexRepository: Repository<CapExItem>,
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async findAllByCycle(cycleId: string, departmentId?: string): Promise<CapExItem[]> {
    if (!this.isUuid(cycleId)) {
      return [];
    }
    const whereClause: any = { cycleId };
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    return this.capexRepository.find({
      where: whereClause,
      relations: ['department'],
      order: { assetName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CapExItem> {
    const item = await this.capexRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!item) {
      throw new NotFoundException(`Item CapEx dengan ID ${id} tidak ditemukan`);
    }
    return item;
  }

  async create(data: Partial<CapExItem>): Promise<CapExItem> {
    const qty = Number(data.qty || 1);
    const cpu = Number(data.costPerUnit || 0);
    data.totalCost = qty * cpu;

    const item = this.capexRepository.create(data);
    return this.capexRepository.save(item);
  }

  async update(id: string, updates: Partial<CapExItem>): Promise<CapExItem> {
    const item = await this.findOne(id);
    Object.assign(item, updates);

    const qty = Number(item.qty || 1);
    const cpu = Number(item.costPerUnit || 0);
    item.totalCost = qty * cpu;

    return this.capexRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.capexRepository.remove(item);
  }
}
