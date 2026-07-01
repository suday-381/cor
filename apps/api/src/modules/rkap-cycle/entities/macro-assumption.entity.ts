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
}
