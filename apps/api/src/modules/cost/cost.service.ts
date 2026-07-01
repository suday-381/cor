import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostLineItem } from './entities/cost-line-item.entity';
import { PersonnelCost } from './entities/personnel-cost.entity';

@Injectable()
export class CostService {
  constructor(
    @InjectRepository(CostLineItem)
    private readonly costLineItemRepository: Repository<CostLineItem>,
    @InjectRepository(PersonnelCost)
    private readonly personnelCostRepository: Repository<PersonnelCost>,
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  // Cost Line Items
  async findAllLineItems(cycleId: string, departmentId?: string): Promise<CostLineItem[]> {
    if (!this.isUuid(cycleId)) {
      return [];
    }
    const whereClause: any = { cycleId };
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    return this.costLineItemRepository.find({
      where: whereClause,
      relations: ['department', 'account'],
      order: { accountCode: 'ASC' },
    });
  }

  async findOneLineItem(id: string): Promise<CostLineItem> {
    const item = await this.costLineItemRepository.findOne({
      where: { id },
      relations: ['department', 'account'],
    });
    if (!item) {
      throw new NotFoundException(`Item anggaran biaya dengan ID ${id} tidak ditemukan`);
    }
    return item;
  }

  async createLineItem(data: Partial<CostLineItem>): Promise<CostLineItem> {
    const item = this.costLineItemRepository.create(data);
    return this.costLineItemRepository.save(item);
  }

  async updateLineItem(id: string, updates: Partial<CostLineItem>): Promise<CostLineItem> {
    const item = await this.findOneLineItem(id);
    Object.assign(item, updates);
    return this.costLineItemRepository.save(item);
  }

  async removeLineItem(id: string): Promise<void> {
    const item = await this.findOneLineItem(id);
    await this.costLineItemRepository.remove(item);
  }

  // Personnel Costs
  async findAllPersonnel(cycleId: string, departmentId?: string): Promise<PersonnelCost[]> {
    if (!this.isUuid(cycleId)) {
      return [];
    }
    const whereClause: any = { cycleId };
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    return this.personnelCostRepository.find({
      where: whereClause,
      relations: ['department'],
      order: { position: 'ASC' },
    });
  }

  async findOnePersonnel(id: string): Promise<PersonnelCost> {
    const item = await this.personnelCostRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!item) {
      throw new NotFoundException(`Item biaya personalia dengan ID ${id} tidak ditemukan`);
    }
    return item;
  }

  async createPersonnel(data: Partial<PersonnelCost>): Promise<PersonnelCost> {
    // totalAnnual = (monthlySalary + allowances + bpjs) * 12 + bonus
    const salary = Number(data.monthlySalary || 0);
    const allowances = Number(data.allowances || 0);
    const bpjs = Number(data.bpjs || 0);
    const bonus = Number(data.bonus || 0);
    const headcount = Number(data.headcount || 1);

    data.totalAnnual = ((salary + allowances + bpjs) * 12 + bonus) * headcount;

    const item = this.personnelCostRepository.create(data);
    return this.personnelCostRepository.save(item);
  }

  async updatePersonnel(id: string, updates: Partial<PersonnelCost>): Promise<PersonnelCost> {
    const item = await this.findOnePersonnel(id);
    Object.assign(item, updates);

    const salary = Number(item.monthlySalary || 0);
    const allowances = Number(item.allowances || 0);
    const bpjs = Number(item.bpjs || 0);
    const bonus = Number(item.bonus || 0);
    const headcount = Number(item.headcount || 1);

    item.totalAnnual = ((salary + allowances + bpjs) * 12 + bonus) * headcount;

    return this.personnelCostRepository.save(item);
  }

  async removePersonnel(id: string): Promise<void> {
    const item = await this.findOnePersonnel(id);
    await this.personnelCostRepository.remove(item);
  }
}
