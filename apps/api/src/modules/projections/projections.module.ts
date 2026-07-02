import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PnlSnapshot } from './entities/pnl-snapshot.entity';
import { CashFlowSnapshot } from './entities/cashflow-snapshot.entity';
import { BalanceSheetSnapshot } from './entities/balance-sheet-snapshot.entity';
import { RkapCycle } from '../rkap-cycle/entities/rkap-cycle.entity';
import { RevenueLineItem } from '../revenue/entities/revenue-line-item.entity';
import { CostLineItem } from '../cost/entities/cost-line-item.entity';
import { PersonnelCost } from '../cost/entities/personnel-cost.entity';
import { CapExItem } from '../capex/entities/capex-item.entity';
import { ProjectionsService } from './projections.service';
import { ProjectionsController } from './projections.controller';

import { ApprovalWorkflow } from '../workflow/entities/approval-workflow.entity';
import { Department } from '../master-data/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PnlSnapshot,
      CashFlowSnapshot,
      BalanceSheetSnapshot,
      RkapCycle,
      RevenueLineItem,
      CostLineItem,
      PersonnelCost,
      CapExItem,
      ApprovalWorkflow,
      Department,
    ]),
  ],
  providers: [ProjectionsService],
  controllers: [ProjectionsController],
  exports: [ProjectionsService],
})
export class ProjectionsModule {}
