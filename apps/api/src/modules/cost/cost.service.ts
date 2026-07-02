import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CostLineItem } from './entities/cost-line-item.entity';
import { PersonnelCost } from './entities/personnel-cost.entity';
import { WorkflowService } from '../workflow/workflow.service';
import { User } from '../users/user.entity';

@Injectable()
export class CostService {
  constructor(
    @InjectRepository(CostLineItem)
    private readonly costLineItemRepository: Repository<CostLineItem>,
    @InjectRepository(PersonnelCost)
    private readonly personnelCostRepository: Repository<PersonnelCost>,
    private readonly workflowService: WorkflowService,
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  private async checkWritePermission(cycleId: string, departmentId: string, user: User) {
    const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);

    if (!isGlobalRole) {
      // Check if writing to department within same division
      const allowedDepts = await this.workflowService.getDivisionDepartmentIds(user.departmentId);
      if (!allowedDepts.includes(departmentId)) {
        throw new ForbiddenException('Akses ditolak: Anda hanya dapat mengisi data anggaran untuk divisi/departemen Anda sendiri.');
      }
    }

    // Check if workflow status is Draft
    const targetDivisionId = await this.workflowService.resolveDivisionId(departmentId);
    const wf = await this.workflowService.getWorkflow(cycleId, targetDivisionId);
    if (wf && (wf as any).documentStatus !== 'Draft') {
      throw new BadRequestException(`Aksi ditolak: Dokumen terkunci (Status: ${(wf as any).documentStatus}). Harap hubungi GM atau buat draft revisi jika ditolak.`);
    }
  }

  // Cost Line Items
  async findAllLineItems(cycleId: string, departmentId?: string, user?: User): Promise<CostLineItem[]> {
    if (!this.isUuid(cycleId)) {
      return [];
    }
    const whereClause: any = { cycleId };

    if (user) {
      const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);
      
      if (!isGlobalRole) {
        const allowedDeptIds = await this.workflowService.getDivisionDepartmentIds(user.departmentId);
        if (departmentId) {
          if (allowedDeptIds.includes(departmentId)) {
            whereClause.departmentId = departmentId;
          } else {
            return [];
          }
        } else {
          whereClause.departmentId = In(allowedDeptIds);
        }
      } else {
        if (departmentId) {
          whereClause.departmentId = departmentId;
        }
      }
    } else {
      if (departmentId) {
        whereClause.departmentId = departmentId;
      }
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

  async createLineItem(data: Partial<CostLineItem>, user: User): Promise<CostLineItem> {
    const targetDeptId = data.departmentId || user.departmentId;
    if (!targetDeptId) {
      throw new BadRequestException('Department ID wajib ditentukan');
    }
    if (!data.cycleId) {
      throw new BadRequestException('Cycle ID wajib ditentukan');
    }
    await this.checkWritePermission(data.cycleId, targetDeptId, user);

    const item = this.costLineItemRepository.create({
      ...data,
      departmentId: targetDeptId,
    });
    return this.costLineItemRepository.save(item);
  }

  async updateLineItem(id: string, updates: Partial<CostLineItem>, user: User): Promise<CostLineItem> {
    const item = await this.findOneLineItem(id);
    await this.checkWritePermission(item.cycleId, item.departmentId, user);

    Object.assign(item, updates);
    return this.costLineItemRepository.save(item);
  }

  async removeLineItem(id: string, user: User): Promise<void> {
    const item = await this.findOneLineItem(id);
    await this.checkWritePermission(item.cycleId, item.departmentId, user);
    await this.costLineItemRepository.remove(item);
  }

  // Personnel Costs
  async findAllPersonnel(cycleId: string, departmentId?: string, user?: User): Promise<PersonnelCost[]> {
    if (!this.isUuid(cycleId)) {
      return [];
    }
    const whereClause: any = { cycleId };

    if (user) {
      const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);
      
      if (!isGlobalRole) {
        const allowedDeptIds = await this.workflowService.getDivisionDepartmentIds(user.departmentId);
        if (departmentId) {
          if (allowedDeptIds.includes(departmentId)) {
            whereClause.departmentId = departmentId;
          } else {
            return [];
          }
        } else {
          whereClause.departmentId = In(allowedDeptIds);
        }
      } else {
        if (departmentId) {
          whereClause.departmentId = departmentId;
        }
      }
    } else {
      if (departmentId) {
        whereClause.departmentId = departmentId;
      }
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

  async createPersonnel(data: Partial<PersonnelCost>, user: User): Promise<PersonnelCost> {
    const targetDeptId = data.departmentId || user.departmentId;
    if (!targetDeptId) {
      throw new BadRequestException('Department ID wajib ditentukan');
    }
    if (!data.cycleId) {
      throw new BadRequestException('Cycle ID wajib ditentukan');
    }
    await this.checkWritePermission(data.cycleId, targetDeptId, user);

    const salary = Number(data.monthlySalary || 0);
    const allowances = Number(data.allowances || 0);
    const bpjs = Number(data.bpjs || 0);
    const bonus = Number(data.bonus || 0);
    const headcount = Number(data.headcount || 1);

    data.totalAnnual = ((salary + allowances + bpjs) * 12 + bonus) * headcount;

    const item = this.personnelCostRepository.create({
      ...data,
      departmentId: targetDeptId,
    });
    return this.personnelCostRepository.save(item);
  }

  async updatePersonnel(id: string, updates: Partial<PersonnelCost>, user: User): Promise<PersonnelCost> {
    const item = await this.findOnePersonnel(id);
    await this.checkWritePermission(item.cycleId, item.departmentId, user);

    Object.assign(item, updates);

    const salary = Number(item.monthlySalary || 0);
    const allowances = Number(item.allowances || 0);
    const bpjs = Number(item.bpjs || 0);
    const bonus = Number(item.bonus || 0);
    const headcount = Number(item.headcount || 1);

    item.totalAnnual = ((salary + allowances + bpjs) * 12 + bonus) * headcount;

    return this.personnelCostRepository.save(item);
  }

  async removePersonnel(id: string, user: User): Promise<void> {
    const item = await this.findOnePersonnel(id);
    await this.checkWritePermission(item.cycleId, item.departmentId, user);
    await this.personnelCostRepository.remove(item);
  }
}
