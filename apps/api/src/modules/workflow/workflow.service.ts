import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ApprovalWorkflow } from './entities/approval-workflow.entity';
import { ApprovalStage } from './entities/approval-stage.entity';
import { ApprovalComment } from './entities/approval-comment.entity';
import { RkapCycle } from '../rkap-cycle/entities/rkap-cycle.entity';
import { Department } from '../master-data/entities/department.entity';
import { User } from '../users/user.entity';
import { ProjectionsService } from '../projections/projections.service';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(ApprovalWorkflow)
    private readonly workflowRepository: Repository<ApprovalWorkflow>,
    @InjectRepository(ApprovalStage)
    private readonly stageRepository: Repository<ApprovalStage>,
    @InjectRepository(ApprovalComment)
    private readonly commentRepository: Repository<ApprovalComment>,
    @InjectRepository(RkapCycle)
    private readonly cycleRepository: Repository<RkapCycle>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @Inject(forwardRef(() => ProjectionsService))
    private readonly projectionsService: ProjectionsService,
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async resolveDivisionId(departmentId?: string): Promise<string | undefined> {
    if (!departmentId) return undefined;
    if (!this.isUuid(departmentId)) return undefined;
    const dept = await this.departmentRepository.findOne({ where: { id: departmentId } });
    if (!dept) return undefined;
    if (dept.parentId) {
      return dept.parentId; // Return division ID
    }
    return dept.id; // It is already a division
  }

  async getDivisionDepartmentIds(departmentId?: string): Promise<string[]> {
    const divisionId = await this.resolveDivisionId(departmentId);
    if (!divisionId) return [];
    const depts = await this.departmentRepository.find({
      where: [{ parentId: divisionId }, { id: divisionId }],
    });
    return depts.map(d => d.id);
  }

  addDocumentStatus(wf: ApprovalWorkflow): any {
    if (!wf) return wf;
    let documentStatus = 'Draft';
    if (wf.status === 'approved') {
      documentStatus = 'Approve';
    } else if (wf.status === 'rejected') {
      documentStatus = 'Reject';
    } else if (wf.status === 'in_progress') {
      if (wf.currentStageIndex === 1) {
        documentStatus = 'In Review GM';
      } else if (wf.currentStageIndex === 2) {
        documentStatus = 'In Review CSP';
      } else {
        documentStatus = 'In Review';
      }
    }
    (wf as any).documentStatus = documentStatus;
    return wf;
  }

  async getWorkflow(cycleId: string, departmentId?: string): Promise<ApprovalWorkflow> {
    if (!this.isUuid(cycleId)) {
      throw new NotFoundException(`Siklus RKAP dengan ID ${cycleId} tidak ditemukan`);
    }

    const divisionId = await this.resolveDivisionId(departmentId);
    if (!divisionId) {
      throw new BadRequestException('ID Divisi/Departemen tidak valid atau tidak ditemukan');
    }

    let workflow = await this.workflowRepository.findOne({
      where: { cycleId, departmentId: divisionId },
      relations: ['stages', 'stages.comments'],
    });

    if (!workflow) {
      // Create division workflow
      workflow = new ApprovalWorkflow();
      workflow.cycleId = cycleId;
      workflow.departmentId = divisionId;
      workflow.status = 'pending';
      workflow.currentStageIndex = 0;
      const savedWf = await this.workflowRepository.save(workflow);

      const stages: ApprovalStage[] = [];

      // Stage 0: Penyusunan Anggaran (approved by default)
      const stage0 = new ApprovalStage();
      stage0.workflowId = savedWf.id;
      stage0.stageName = 'Penyusunan Anggaran';
      stage0.approverRole = 'budget_owner';
      stage0.status = 'approved';
      stage0.sortOrder = 0;
      stages.push(stage0);

      // Stage 1: Review General Manager Divisi
      const stage1 = new ApprovalStage();
      stage1.workflowId = savedWf.id;
      stage1.stageName = 'Review General Manager Divisi';
      stage1.approverRole = 'gm';
      stage1.status = 'pending';
      stage1.sortOrder = 1;
      stages.push(stage1);

      // Stage 2: Persetujuan Corporate Strategic Planning
      const stage2 = new ApprovalStage();
      stage2.workflowId = savedWf.id;
      stage2.stageName = 'Persetujuan Corporate Strategic Planning';
      stage2.approverRole = 'csp';
      stage2.status = 'pending';
      stage2.sortOrder = 2;
      stages.push(stage2);

      await this.stageRepository.save(stages);

      workflow = await this.workflowRepository.findOne({
        where: { id: savedWf.id },
        relations: ['stages', 'stages.comments'],
      });
    }

    if (!workflow) {
      throw new NotFoundException(`Workflow untuk siklus ${cycleId} tidak dapat dibuat`);
    }

    if (!workflow.stages) {
      workflow.stages = [];
    }

    workflow.stages.sort((a, b) => a.sortOrder - b.sortOrder);
    return this.addDocumentStatus(workflow);
  }

  async submit(cycleId: string, departmentId: string | undefined, user: User): Promise<ApprovalWorkflow> {
    const divisionId = await this.resolveDivisionId(departmentId || user.departmentId);
    const wf = await this.getWorkflow(cycleId, divisionId);

    if (!wf || !wf.stages || wf.stages.length < 3) {
      throw new BadRequestException('Workflow tidak valid atau belum diinisialisasi');
    }
    if (wf.status === 'in_progress' || wf.status === 'approved') {
      throw new BadRequestException('Workflow sudah diajukan atau disetujui');
    }

    wf.status = 'in_progress';
    wf.currentStageIndex = 1;
    wf.submittedAt = new Date().toISOString();

    wf.stages.sort((a, b) => a.sortOrder - b.sortOrder);
    wf.stages[0].status = 'approved';
    wf.stages[0].decidedAt = new Date().toISOString();
    wf.stages[1].status = 'pending';

    await this.stageRepository.save(wf.stages[0]);
    await this.stageRepository.save(wf.stages[1]);
    await this.workflowRepository.save(wf);

    // Recalculate division projections to draft status
    await this.projectionsService.recalculate(cycleId, undefined, divisionId);

    return this.getWorkflow(cycleId, divisionId);
  }

  async approveStage(cycleId: string, departmentId: string | undefined, commentText: string, user: User): Promise<ApprovalWorkflow> {
    const divisionId = await this.resolveDivisionId(departmentId || user.departmentId);
    const wf = await this.getWorkflow(cycleId, divisionId);

    if (!wf || !wf.stages || wf.stages.length === 0) {
      throw new BadRequestException('Workflow tidak valid atau belum diinisialisasi');
    }
    if (wf.status !== 'in_progress') {
      throw new BadRequestException('Workflow tidak sedang aktif dalam pengajuan');
    }

    const currentIdx = wf.currentStageIndex;
    const currentStage = wf.stages[currentIdx];

    if (currentStage.approverRole !== user.role && user.role !== 'super_admin') {
      throw new BadRequestException('Anda tidak memiliki peran yang tepat untuk menyetujui tahap ini');
    }

    // Add comment
    const comment = new ApprovalComment();
    comment.stageId = currentStage.id;
    comment.userId = user.id;
    comment.userName = user.name;
    comment.userRole = user.role;
    comment.content = commentText || 'Disetujui';
    await this.commentRepository.save(comment);

    currentStage.status = 'approved';
    currentStage.decidedAt = new Date().toISOString();
    currentStage.approverUserId = user.id;
    currentStage.approverName = user.name;
    await this.stageRepository.save(currentStage);

    const nextIdx = currentIdx + 1;
    if (nextIdx >= wf.stages.length) {
      // Completed approval (Approved by CSP)
      wf.status = 'approved';
      wf.completedAt = new Date().toISOString();
      await this.workflowRepository.save(wf);

      // Trigger global projections recalculation since this division is approved
      await this.projectionsService.recalculate(cycleId);
    } else {
      wf.currentStageIndex = nextIdx;
      wf.stages[nextIdx].status = 'pending';
      await this.stageRepository.save(wf.stages[nextIdx]);
      await this.workflowRepository.save(wf);
    }

    return this.getWorkflow(cycleId, divisionId);
  }

  async rejectStage(cycleId: string, departmentId: string | undefined, commentText: string, user: User): Promise<ApprovalWorkflow> {
    const divisionId = await this.resolveDivisionId(departmentId || user.departmentId);
    const wf = await this.getWorkflow(cycleId, divisionId);

    if (!wf || !wf.stages || wf.stages.length === 0) {
      throw new BadRequestException('Workflow tidak valid atau belum diinisialisasi');
    }
    if (wf.status !== 'in_progress') {
      throw new BadRequestException('Workflow tidak sedang aktif dalam pengajuan');
    }

    const currentIdx = wf.currentStageIndex;
    const currentStage = wf.stages[currentIdx];

    if (currentStage.approverRole !== user.role && user.role !== 'super_admin') {
      throw new BadRequestException('Anda tidak memiliki peran yang tepat untuk menolak tahap ini');
    }

    if (!commentText) {
      throw new BadRequestException('Catatan penolakan/revisi wajib diisi');
    }

    // Add comment
    const comment = new ApprovalComment();
    comment.stageId = currentStage.id;
    comment.userId = user.id;
    comment.userName = user.name;
    comment.userRole = user.role;
    comment.content = commentText;
    await this.commentRepository.save(comment);

    currentStage.status = 'rejected';
    currentStage.decidedAt = new Date().toISOString();
    currentStage.approverUserId = user.id;
    currentStage.approverName = user.name;
    await this.stageRepository.save(currentStage);

    wf.status = 'rejected';
    await this.workflowRepository.save(wf);

    return this.getWorkflow(cycleId, divisionId);
  }

  async reviseWorkflow(cycleId: string, departmentId: string | undefined, user: User): Promise<ApprovalWorkflow> {
    const divisionId = await this.resolveDivisionId(departmentId || user.departmentId);
    const wf = await this.getWorkflow(cycleId, divisionId);

    if (!wf) {
      throw new NotFoundException('Workflow tidak ditemukan');
    }
    if (wf.status !== 'rejected') {
      throw new BadRequestException('Hanya workflow dengan status ditolak (Reject) yang dapat direvisi');
    }

    wf.status = 'pending';
    wf.currentStageIndex = 0;
    
    // Reset stages
    if (!wf.stages || wf.stages.length < 3) {
      throw new BadRequestException('Tahapan workflow tidak lengkap untuk direvisi');
    }

    wf.stages.sort((a, b) => a.sortOrder - b.sortOrder);
    wf.stages[0].status = 'approved';
    wf.stages[1].status = 'pending';
    wf.stages[2].status = 'pending';

    await this.stageRepository.save(wf.stages[0]);
    await this.stageRepository.save(wf.stages[1]);
    await this.stageRepository.save(wf.stages[2]);
    await this.workflowRepository.save(wf);

    return this.getWorkflow(cycleId, divisionId);
  }

  async getDivisionsWorkflowStatus(cycleId: string) {
    // Fetch all parent divisions (parentId = null)
    const divisions = await this.departmentRepository.find({
      where: { parentId: IsNull() },
      order: { sortOrder: 'ASC' },
    });

    const result = [];
    for (const div of divisions) {
      let wf = await this.workflowRepository.findOne({
        where: { cycleId, departmentId: div.id },
      });

      const finalWf = wf || ({
        status: 'pending',
        currentStageIndex: 0,
      } as any);
      const wfWithStatus = this.addDocumentStatus(finalWf);
      result.push({
        divisionId: div.id,
        divisionName: div.name,
        divisionCode: div.code,
        status: wfWithStatus.status,
        documentStatus: (wfWithStatus as any).documentStatus,
        submittedAt: wfWithStatus.submittedAt || null,
        completedAt: wfWithStatus.completedAt || null,
      });
    }

    return result;
  }
}
