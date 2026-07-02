import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RevenueLineItem } from './entities/revenue-line-item.entity';
import { Department } from '../master-data/entities/department.entity';
import { WorkflowService } from '../workflow/workflow.service';
import { User } from '../users/user.entity';

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(RevenueLineItem)
    private readonly revenueRepository: Repository<RevenueLineItem>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly workflowService: WorkflowService,
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  private async checkWritePermission(cycleId: string, departmentId: string, user: User) {
    // 1. Super Admin, CSP, CFO have global bypass
    const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);

    // 2. Check department access
    const userDivisionId = await this.workflowService.resolveDivisionId(user.departmentId);
    const division = await this.departmentRepository.findOne({ where: { id: userDivisionId } });
    
    if (!isGlobalRole) {
      if (!division || (division.code !== 'DIV_BDS' && division.code !== 'DIV_MBS')) {
        throw new ForbiddenException('Akses ditolak: Hanya divisi Business Development & Support atau Marketing & Business Sales yang memiliki akses ke Anggaran Pendapatan.');
      }

      // Check if writing to department within same division
      const allowedDepts = await this.workflowService.getDivisionDepartmentIds(user.departmentId);
      if (!allowedDepts.includes(departmentId)) {
        throw new ForbiddenException('Akses ditolak: Anda hanya dapat mengisi data anggaran untuk divisi/departemen Anda sendiri.');
      }
    }

    // 3. Check workflow status (Must be Draft)
    const targetDivisionId = await this.workflowService.resolveDivisionId(departmentId);
    const wf = await this.workflowService.getWorkflow(cycleId, targetDivisionId);
    if (wf && (wf as any).documentStatus !== 'Draft') {
      throw new BadRequestException(`Aksi ditolak: Dokumen terkunci (Status: ${(wf as any).documentStatus}). Harap hubungi GM atau buat draft revisi jika ditolak.`);
    }
  }

  async findAllByCycle(cycleId: string, departmentId?: string, user?: User): Promise<RevenueLineItem[]> {
    if (!this.isUuid(cycleId)) {
      return [];
    }

    const whereClause: any = { cycleId };

    if (user) {
      const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);
      
      // If user is not global role, enforce division check
      if (!isGlobalRole) {
        const userDivisionId = await this.workflowService.resolveDivisionId(user.departmentId);
        const division = await this.departmentRepository.findOne({ where: { id: userDivisionId } });
        if (!division || (division.code !== 'DIV_BDS' && division.code !== 'DIV_MBS')) {
          return []; // Forbidden from viewing revenue entirely
        }

        const allowedDeptIds = await this.workflowService.getDivisionDepartmentIds(user.departmentId);
        if (departmentId) {
          if (allowedDeptIds.includes(departmentId)) {
            whereClause.departmentId = departmentId;
          } else {
            return []; // Requesting outside division
          }
        } else {
          whereClause.departmentId = In(allowedDeptIds);
        }
      } else {
        // Global roles
        if (departmentId) {
          whereClause.departmentId = departmentId;
        }
      }
    } else {
      if (departmentId) {
        whereClause.departmentId = departmentId;
      }
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

  async create(data: Partial<RevenueLineItem>, user: User): Promise<RevenueLineItem> {
    const targetDeptId = data.departmentId || user.departmentId;
    if (!targetDeptId) {
      throw new BadRequestException('Department ID wajib ditentukan');
    }
    if (!data.cycleId) {
      throw new BadRequestException('Cycle ID wajib ditentukan');
    }
    await this.checkWritePermission(data.cycleId, targetDeptId, user);

    const item = this.revenueRepository.create({
      ...data,
      departmentId: targetDeptId,
    });
    return this.revenueRepository.save(item);
  }

  async update(id: string, updates: Partial<RevenueLineItem>, user: User): Promise<RevenueLineItem> {
    const item = await this.findOne(id);
    await this.checkWritePermission(item.cycleId, item.departmentId, user);

    Object.assign(item, updates);
    return this.revenueRepository.save(item);
  }

  async remove(id: string, user: User): Promise<void> {
    const item = await this.findOne(id);
    await this.checkWritePermission(item.cycleId, item.departmentId, user);
    await this.revenueRepository.remove(item);
  }
}
