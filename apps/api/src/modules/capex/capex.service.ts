import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CapExItem } from './entities/capex-item.entity';
import { WorkflowService } from '../workflow/workflow.service';
import { User } from '../users/user.entity';

@Injectable()
export class CapexService {
  constructor(
    @InjectRepository(CapExItem)
    private readonly capexRepository: Repository<CapExItem>,
    private readonly workflowService: WorkflowService,
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  private async checkWritePermission(cycleId: string, departmentId: string, user: User) {
    await this.workflowService.checkDueDate(cycleId, user);
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

  async findAllByCycle(cycleId: string, departmentId?: string, user?: User): Promise<CapExItem[]> {
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

  async create(data: Partial<CapExItem>, user: User): Promise<CapExItem> {
    const targetDeptId = data.departmentId || user.departmentId;
    if (!targetDeptId) {
      throw new BadRequestException('Department ID wajib ditentukan');
    }
    if (!data.cycleId) {
      throw new BadRequestException('Cycle ID wajib ditentukan');
    }
    await this.checkWritePermission(data.cycleId, targetDeptId, user);

    const qty = Number(data.qty || 1);
    const cpu = Number(data.costPerUnit || 0);
    data.totalCost = qty * cpu;

    const item = this.capexRepository.create({
      ...data,
      departmentId: targetDeptId,
    });
    return this.capexRepository.save(item);
  }

  async update(id: string, updates: Partial<CapExItem>, user: User): Promise<CapExItem> {
    const item = await this.findOne(id);
    await this.checkWritePermission(item.cycleId, item.departmentId, user);

    Object.assign(item, updates);

    const qty = Number(item.qty || 1);
    const cpu = Number(item.costPerUnit || 0);
    item.totalCost = qty * cpu;

    return this.capexRepository.save(item);
  }

  async remove(id: string, user: User): Promise<void> {
    const item = await this.findOne(id);
    await this.checkWritePermission(item.cycleId, item.departmentId, user);
    await this.capexRepository.remove(item);
  }
}
