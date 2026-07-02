import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalWorkflow } from './entities/approval-workflow.entity';
import { ApprovalStage } from './entities/approval-stage.entity';
import { ApprovalComment } from './entities/approval-comment.entity';
import { RkapCycle } from '../rkap-cycle/entities/rkap-cycle.entity';
import { Department } from '../master-data/entities/department.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { ProjectionsModule } from '../projections/projections.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApprovalWorkflow,
      ApprovalStage,
      ApprovalComment,
      RkapCycle,
      Department,
    ]),
    forwardRef(() => ProjectionsModule),
  ],
  providers: [WorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}
