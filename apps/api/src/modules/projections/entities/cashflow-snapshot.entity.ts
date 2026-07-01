import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { RkapCycle } from '../../rkap-cycle/entities/rkap-cycle.entity';
import { WorkingCapitalAssumptions, MonthlyValues } from '@corplan/shared-types';

@Entity('cashflow_snapshots')
export class CashFlowSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => RkapCycle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cycle_id' })
  cycle?: RkapCycle;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'jsonb', name: 'operating_activities' })
  operatingActivities: {
    netIncome: MonthlyValues;
    depreciationAdj: MonthlyValues;
    receivablesChange: MonthlyValues;
    inventoryChange: MonthlyValues;
    payablesChange: MonthlyValues;
    otherAdjustments: MonthlyValues;
    totalOperating: MonthlyValues;
  };

  @Column({ type: 'jsonb', name: 'investing_activities' })
  investingActivities: {
    capex: MonthlyValues;
    assetDisposal: MonthlyValues;
    investments: MonthlyValues;
    totalInvesting: MonthlyValues;
  };

  @Column({ type: 'jsonb', name: 'financing_activities' })
  financingActivities: {
    loanProceeds: MonthlyValues;
    loanRepayments: MonthlyValues;
    equityIssuance: MonthlyValues;
    dividendsPaid: MonthlyValues;
    totalFinancing: MonthlyValues;
  };

  @Column({ type: 'jsonb', name: 'net_cash_flow' })
  netCashFlow: MonthlyValues;

  @Column({ type: 'jsonb', name: 'opening_cash' })
  openingCash: MonthlyValues;

  @Column({ type: 'jsonb', name: 'closing_cash' })
  closingCash: MonthlyValues;

  @Column({ type: 'jsonb', name: 'wc_assumptions' })
  wcAssumptions: WorkingCapitalAssumptions;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: string;
}
