import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalWorkflow } from './entities/approval-workflow.entity';
import { ApprovalStage } from './entities/approval-stage.entity';
import { ApprovalComment } from './entities/approval-comment.entity';
import { RkapCycle } from '../rkap-cycle/entities/rkap-cycle.entity';
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
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async getWorkflow(cycleId: string): Promise<ApprovalWorkflow> {
    if (!this.isUuid(cycleId)) {
      throw new NotFoundException(`Siklus RKAP dengan ID ${cycleId} tidak ditemukan`);
    }
    let workflow = await this.workflowRepository.findOne({
      where: { cycleId },
      relations: ['stages', 'stages.comments'],
    });

    if (!workflow) {
      // Initialize workflow
      workflow = new ApprovalWorkflow();
      workflow.cycleId = cycleId;
      workflow.status = 'pending';
      workflow.currentStageIndex = 0;
      const savedWf = await this.workflowRepository.save(workflow);

      // Create standard stages
      const stage0 = new ApprovalStage();
      stage0.workflowId = savedWf.id;
      stage0.stageName = 'Penyusunan Anggaran';
      stage0.approverRole = 'finance_manager';
      stage0.status = 'approved'; // Budget draft starts complete/ready

      const stage1 = new ApprovalStage();
      stage1.workflowId = savedWf.id;
      stage1.stageName = 'Review Finance Manager';
      stage1.approverRole = 'finance_manager';
      stage1.status = 'pending';

      const stage2 = new ApprovalStage();
      stage2.workflowId = savedWf.id;
      stage2.stageName = 'Persetujuan CFO';
      stage2.approverRole = 'cfo';
      stage2.status = 'pending';

      await this.stageRepository.save([stage0, stage1, stage2]);

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

    // Sort stages by order (since TypeORM may return them unsorted, we order them)
    // For simplicity, Penyusunan Anggaran is first, Review Finance Manager second, CFO third
    const orderMap: Record<string, number> = {
      'Penyusunan Anggaran': 0,
      'Review Finance Manager': 1,
      'Persetujuan CFO': 2,
    };
    workflow.stages.sort((a, b) => (orderMap[a.stageName] ?? 0) - (orderMap[b.stageName] ?? 0));

    return workflow;
  }

  async submit(cycleId: string, user: User): Promise<ApprovalWorkflow> {
    const wf = await this.getWorkflow(cycleId);
    if (!wf || !wf.stages || wf.stages.length < 2) {
      throw new BadRequestException('Workflow tidak valid atau belum diinisialisasi');
    }
    if (wf.status === 'in_progress' || wf.status === 'approved') {
      throw new BadRequestException('Workflow sudah diajukan atau disetujui');
    }

    wf.status = 'in_progress';
    wf.currentStageIndex = 1;
    wf.submittedAt = new Date().toISOString();

    const orderMap: Record<string, number> = {
      'Penyusunan Anggaran': 0,
      'Review Finance Manager': 1,
      'Persetujuan CFO': 2,
    };
    wf.stages.sort((a, b) => (orderMap[a.stageName] ?? 0) - (orderMap[b.stageName] ?? 0));

    wf.stages[0].status = 'approved';
    wf.stages[0].decidedAt = new Date().toISOString();
    wf.stages[1].status = 'pending';

    await this.stageRepository.save(wf.stages[0]);
    await this.stageRepository.save(wf.stages[1]);
    await this.workflowRepository.save(wf);

    // Sync cycle status
    await this.cycleRepository.update(cycleId, { status: 'in_review' });

    return this.getWorkflow(cycleId);
  }

  async approveStage(cycleId: string, commentText: string, user: User): Promise<ApprovalWorkflow> {
    const wf = await this.getWorkflow(cycleId);
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

    return this.getWorkflow(cycleId);
  }

  async rejectStage(cycleId: string, commentText: string, user: User): Promise<ApprovalWorkflow> {
    const wf = await this.getWorkflow(cycleId);
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

    return this.getWorkflow(cycleId);
  }
}
