import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalWorkflow } from './entities/approval-workflow.entity';
import { ApprovalStage } from './entities/approval-stage.entity';
import { ApprovalComment } from './entities/approval-comment.entity';
import { Department } from '../master-data/entities/department.entity';
import { RkapCycle } from '../rkap-cycle/entities/rkap-cycle.entity';
import { PnlSnapshot } from '../projections/entities/pnl-snapshot.entity';
import { CashFlowSnapshot } from '../projections/entities/cashflow-snapshot.entity';
import { BalanceSheetSnapshot } from '../projections/entities/balance-sheet-snapshot.entity';
import { ProjectionsService } from '../projections/projections.service';

describe('WorkflowService (Unit Tests)', () => {
  let service: WorkflowService;
  let workflowRepository: Partial<Record<keyof Repository<ApprovalWorkflow>, jest.Mock>>;
  let stageRepository: Partial<Record<keyof Repository<ApprovalStage>, jest.Mock>>;
  let commentRepository: Partial<Record<keyof Repository<ApprovalComment>, jest.Mock>>;
  let departmentRepository: Partial<Record<keyof Repository<Department>, jest.Mock>>;
  let cycleRepository: Partial<Record<keyof Repository<RkapCycle>, jest.Mock>>;

  const validCycleId = 'a0000000-0000-0000-0000-000000000001';
  const validDeptId = 'b0000000-0000-0000-0000-000000000002';
  const validDivId = 'c0000000-0000-0000-0000-000000000003';

  beforeEach(async () => {
    workflowRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    stageRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    commentRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    departmentRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    cycleRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: getRepositoryToken(ApprovalWorkflow), useValue: workflowRepository },
        { provide: getRepositoryToken(ApprovalStage), useValue: stageRepository },
        { provide: getRepositoryToken(ApprovalComment), useValue: commentRepository },
        { provide: getRepositoryToken(Department), useValue: departmentRepository },
        { provide: getRepositoryToken(RkapCycle), useValue: cycleRepository },
        { provide: getRepositoryToken(PnlSnapshot), useValue: {} },
        { provide: getRepositoryToken(CashFlowSnapshot), useValue: {} },
        { provide: getRepositoryToken(BalanceSheetSnapshot), useValue: {} },
        { provide: ProjectionsService, useValue: { recalculate: jest.fn() } },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveDivisionId', () => {
    it('should return parentId if parentId is not null', async () => {
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: validDeptId, parentId: validDivId });
      const res = await service.resolveDivisionId(validDeptId);
      expect(res).toBe(validDivId);
    });

    it('should return id itself if parentId is null', async () => {
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: validDivId, parentId: null });
      const res = await service.resolveDivisionId(validDivId);
      expect(res).toBe(validDivId);
    });
  });

  describe('getWorkflow', () => {
    it('should return a workflow and append documentStatus draft if no stages', async () => {
      (cycleRepository.findOne as jest.Mock).mockResolvedValue({ id: validCycleId });
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: validDivId, parentId: null });
      (workflowRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'wf-1',
        status: 'pending',
        currentStageIndex: 0,
        stages: [],
      });
      const res = await service.getWorkflow(validCycleId, validDivId);
      expect(res).toBeDefined();
      expect((res as any).documentStatus).toBe('Draft');
    });

    it('should append documentStatus In Review GM if stage index is 1', async () => {
      (cycleRepository.findOne as jest.Mock).mockResolvedValue({ id: validCycleId });
      (departmentRepository.findOne as jest.Mock).mockResolvedValue({ id: validDivId, parentId: null });
      (workflowRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'wf-1',
        status: 'in_progress',
        currentStageIndex: 1,
        stages: [{}, {}],
      });
      const res = await service.getWorkflow(validCycleId, validDivId);
      expect((res as any).documentStatus).toBe('In Review GM');
    });
  });
});
