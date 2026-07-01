import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Department } from '../modules/master-data/entities/department.entity';
import { ChartOfAccount } from '../modules/master-data/entities/chart-of-account.entity';
import { RkapCycle } from '../modules/rkap-cycle/entities/rkap-cycle.entity';
import { CycleVersion } from '../modules/rkap-cycle/entities/cycle-version.entity';
import { MacroAssumption } from '../modules/rkap-cycle/entities/macro-assumption.entity';
import { RevenueLineItem } from '../modules/revenue/entities/revenue-line-item.entity';
import { CostLineItem } from '../modules/cost/entities/cost-line-item.entity';
import { PersonnelCost } from '../modules/cost/entities/personnel-cost.entity';
import { CapExItem } from '../modules/capex/entities/capex-item.entity';
import { PnlSnapshot } from '../modules/projections/entities/pnl-snapshot.entity';
import { CashFlowSnapshot } from '../modules/projections/entities/cashflow-snapshot.entity';
import { BalanceSheetSnapshot } from '../modules/projections/entities/balance-sheet-snapshot.entity';
import { ApprovalWorkflow } from '../modules/workflow/entities/approval-workflow.entity';
import { ApprovalStage } from '../modules/workflow/entities/approval-stage.entity';
import { ApprovalComment } from '../modules/workflow/entities/approval-comment.entity';
import { AuditLog } from '../modules/audit-log/entities/audit-log.entity';
import { Notification } from '../modules/notification/entities/notification.entity';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'corplan_rkap',
  entities: [
    User, Department, ChartOfAccount, RkapCycle, CycleVersion, MacroAssumption,
    RevenueLineItem, CostLineItem, PersonnelCost, CapExItem, PnlSnapshot,
    CashFlowSnapshot, BalanceSheetSnapshot, ApprovalWorkflow, ApprovalStage,
    ApprovalComment, AuditLog, Notification
  ],
  synchronize: true, // Auto sync schema in development
}));
