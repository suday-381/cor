import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { RkapCycle } from './rkap-cycle.entity';

@Entity('macro_assumptions')
export class MacroAssumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @OneToOne(() => RkapCycle, (cycle) => cycle.macroAssumptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cycle_id' })
  cycle?: RkapCycle;

  @Column({ type: 'decimal', name: 'inflation_rate', precision: 5, scale: 2 })
  inflationRate: number;

  @Column({ type: 'decimal', name: 'exchange_rate_usd_idr', precision: 10, scale: 2 })
  exchangeRateUsdIdr: number;

  @Column({ type: 'decimal', name: 'bi_interest_rate', precision: 5, scale: 2 })
  biInterestRate: number;

  @Column({ type: 'decimal', name: 'industry_growth_rate', precision: 5, scale: 2 })
  industryGrowthRate: number;

  @Column({ type: 'jsonb', name: 'commodity_prices' })
  commodityPrices: Record<string, number>;

  @Column({ type: 'decimal', name: 'tax_rate', precision: 5, scale: 2, default: 22.0 })
  taxRate: number;

  @Column({ type: 'decimal', name: 'beginning_cash', precision: 18, scale: 2, default: 15000000000.0 })
  beginningCash: number;

  @Column({ type: 'varchar', name: 'beginning_cash_option', default: 'manual' })
  beginningCashOption: 'manual' | 'previous_year';

  @Column({ type: 'decimal', name: 'new_loan_amount', precision: 18, scale: 2, default: 0.0 })
  newLoanAmount: number;

  @Column({ type: 'decimal', name: 'loan_interest_rate', precision: 5, scale: 2, default: 0.0 })
  loanInterestRate: number;

  @Column({ type: 'decimal', name: 'loan_repayment_annual', precision: 18, scale: 2, default: 0.0 })
  loanRepaymentAnnual: number;

  @Column({ type: 'decimal', name: 'dividends_paid', precision: 18, scale: 2, default: 0.0 })
  dividendsPaid: number;

  @Column({ type: 'jsonb', name: 'previous_balance_sheet', nullable: true })
  previousBalanceSheet?: Record<string, number>;
}
