import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ApprovalWorkflow } from './entities/approval-workflow.entity';
import { ApprovalStage } from './entities/approval-stage.entity';
import { ApprovalComment } from './entities/approval-comment.entity';
import { RkapCycle } from '../rkap-cycle/entities/rkap-cycle.entity';
import { Department } from '../master-data/entities/department.entity';
import { User } from '../users/user.entity';

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
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async getWorkflow(cycleId: string, departmentId?: string): Promise<ApprovalWorkflow> {
    if (!this.isUuid(cycleId)) {
      throw new NotFoundException(`Siklus RKAP dengan ID ${cycleId} tidak ditemukan`);
    }

    const whereClause: any = { cycleId };
    if (departmentId) {
      whereClause.departmentId = departmentId;
    } else {
      whereClause.departmentId = IsNull();
    }

    let workflow = await this.workflowRepository.findOne({
      where: whereClause,
      relations: ['stages', 'stages.comments'],
    });

    if (!workflow) {
      // In order to check department code, we need to load it
      let isBusinessDept = false;
      if (departmentId) {
        const dept = await this.departmentRepository.findOne({ where: { id: departmentId } });
        if (dept && (dept.code === 'SAL' || dept.code === 'OPS' || dept.isRevenueCenter)) {
          isBusinessDept = true;
        }
      }

      // Initialize workflow
      workflow = new ApprovalWorkflow();
      workflow.cycleId = cycleId;
      workflow.departmentId = departmentId;
      workflow.status = 'pending';
      workflow.currentStageIndex = 0;
      const savedWf = await this.workflowRepository.save(workflow);

      const stages: ApprovalStage[] = [];

      if (isBusinessDept) {
        // Stage 0: Penyusunan Anggaran (completed by default)
        const stage0 = new ApprovalStage();
        stage0.workflowId = savedWf.id;
        stage0.stageName = 'Penyusunan Anggaran';
        stage0.approverRole = 'finance_manager';
        stage0.status = 'approved';
        stage0.sortOrder = 0;
        stages.push(stage0);

        // Stage 1: Review/Approval CSP Senior Manager
        const stage1 = new ApprovalStage();
        stage1.workflowId = savedWf.id;
        stage1.stageName = 'Review CSP Senior Manager';
        stage1.approverRole = 'csp_senior_manager';
        stage1.status = 'pending';
        stage1.sortOrder = 1;
        stages.push(stage1);

        // Stage 2: Persetujuan GM CSP & Finance
        const stage2 = new ApprovalStage();
        stage2.workflowId = savedWf.id;
        stage2.stageName = 'Persetujuan GM CSP & Finance';
        stage2.approverRole = 'gm_csp_finance';
        stage2.status = 'pending';
        stage2.sortOrder = 2;
        stages.push(stage2);

        // Stage 3: Persetujuan CFO
        const stage3 = new ApprovalStage();
        stage3.workflowId = savedWf.id;
        stage3.stageName = 'Persetujuan CFO';
        stage3.approverRole = 'cfo';
        stage3.status = 'pending';
        stage3.sortOrder = 3;
        stages.push(stage3);
      } else {
        // Standard stages
        const stage0 = new ApprovalStage();
        stage0.workflowId = savedWf.id;
        stage0.stageName = 'Penyusunan Anggaran';
        stage0.approverRole = 'finance_manager';
        stage0.status = 'approved';
        stage0.sortOrder = 0;
        stages.push(stage0);

        const stage1 = new ApprovalStage();
        stage1.workflowId = savedWf.id;
        stage1.stageName = 'Review Finance Manager';
        stage1.approverRole = 'finance_manager';
        stage1.status = 'pending';
        stage1.sortOrder = 1;
        stages.push(stage1);

        const stage2 = new ApprovalStage();
        stage2.workflowId = savedWf.id;
        stage2.stageName = 'Persetujuan CFO';
        stage2.approverRole = 'cfo';
        stage2.status = 'pending';
        stage2.sortOrder = 2;
        stages.push(stage2);
      }

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

    // Sort stages by sortOrder
    workflow.stages.sort((a, b) => a.sortOrder - b.sortOrder);

    return workflow;
  }

  async submit(cycleId: string, departmentId: string | undefined, user: User): Promise<ApprovalWorkflow> {
    const wf = await this.getWorkflow(cycleId, departmentId);
    if (!wf || !wf.stages || wf.stages.length < 2) {
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

    // Sync cycle status
    await this.cycleRepository.update(cycleId, { status: 'in_review' });

    return this.getWorkflow(cycleId, departmentId);
  }

  async approveStage(cycleId: string, departmentId: string | undefined, commentText: string, user: User): Promise<ApprovalWorkflow> {
    const wf = await this.getWorkflow(cycleId, departmentId);
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
      // Completed approval
      wf.status = 'approved';
      wf.completedAt = new Date().toISOString();
      await this.workflowRepository.save(wf);

      // Sync cycle status
      await this.cycleRepository.update(cycleId, { status: 'approved' });
    } else {
      wf.currentStageIndex = nextIdx;
      wf.stages[nextIdx].status = 'pending';
      await this.stageRepository.save(wf.stages[nextIdx]);
      await this.workflowRepository.save(wf);
    }

    return this.getWorkflow(cycleId, departmentId);
  }

  async rejectStage(cycleId: string, departmentId: string | undefined, commentText: string, user: User): Promise<ApprovalWorkflow> {
    const wf = await this.getWorkflow(cycleId, departmentId);
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

    // Sync cycle status to draft (so it can be revised)
    await this.cycleRepository.update(cycleId, { status: 'draft' });

    return this.getWorkflow(cycleId, departmentId);
  }
}
