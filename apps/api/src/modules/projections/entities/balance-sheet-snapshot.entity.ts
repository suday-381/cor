import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { RkapCycle } from '../../rkap-cycle/entities/rkap-cycle.entity';
import { MonthlyValues } from '@corplan/shared-types';

@Entity('balance_sheet_snapshots')
export class BalanceSheetSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => RkapCycle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cycle_id' })
  cycle?: RkapCycle;

  @Column({ type: 'int' })
  version: number;

  @Column({ name: 'division_id', nullable: true })
  divisionId?: string;

  @Column({ type: 'jsonb', name: 'current_assets' })
  currentAssets: {
    cashAndEquivalents: MonthlyValues;
    accountsReceivable: MonthlyValues;
    inventory: MonthlyValues;
    prepaidExpenses: MonthlyValues;
    totalCurrentAssets: MonthlyValues;
  };

  @Column({ type: 'jsonb', name: 'non_current_assets' })
  nonCurrentAssets: {
    fixedAssets: MonthlyValues;
    accumulatedDepreciation: MonthlyValues;
    netFixedAssets: MonthlyValues;
    longTermInvestments: MonthlyValues;
    otherAssets: MonthlyValues;
    totalNonCurrentAssets: MonthlyValues;
  };

  @Column({ type: 'jsonb', name: 'total_assets' })
  totalAssets: MonthlyValues;

  @Column({ type: 'jsonb', name: 'current_liabilities' })
  currentLiabilities: {
    accountsPayable: MonthlyValues;
    taxPayable: MonthlyValues;
    accruedExpenses: MonthlyValues;
    shortTermDebt: MonthlyValues;
    totalCurrentLiabilities: MonthlyValues;
  };

  @Column({ type: 'jsonb', name: 'long_term_liabilities' })
  longTermLiabilities: {
    longTermDebt: MonthlyValues;
    bonds: MonthlyValues;
    employeeBenefits: MonthlyValues;
    totalLongTermLiabilities: MonthlyValues;
  };

  @Column({ type: 'jsonb', name: 'total_liabilities' })
  totalLiabilities: MonthlyValues;

  @Column({ type: 'jsonb' })
  equity: {
    shareCapital: MonthlyValues;
    retainedEarnings: MonthlyValues;
    reserves: MonthlyValues;
    totalEquity: MonthlyValues;
  };

  @Column({ type: 'jsonb', name: 'total_liabilities_and_equity' })
  totalLiabilitiesAndEquity: MonthlyValues;

  @Column({ name: 'is_balanced', default: true })
  isBalanced: boolean;

  @Column({ type: 'jsonb' })
  discrepancy: MonthlyValues;

  @Column({ type: 'jsonb', name: 'financial_ratios' })
  financialRatios: {
    currentRatio: MonthlyValues;
    debtToEquity: MonthlyValues;
    roe: MonthlyValues;
    roa: MonthlyValues;
  };

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: string;
}
