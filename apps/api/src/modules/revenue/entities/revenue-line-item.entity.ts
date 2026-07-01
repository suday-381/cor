import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RkapCycle } from '../../rkap-cycle/entities/rkap-cycle.entity';
import { Department } from '../../master-data/entities/department.entity';
import { ChartOfAccount } from '../../master-data/entities/chart-of-account.entity';
import { MonthlyValues } from '@corplan/shared-types';

@Entity('revenue_line_items')
export class RevenueLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => RkapCycle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cycle_id' })
  cycle?: RkapCycle;

  @Column({ name: 'department_id' })
  departmentId: string;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => ChartOfAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account?: ChartOfAccount;

  @Column({ name: 'product_name' })
  productName: string;

  @Column()
  segment: string;

  @Column()
  channel: string;

  @Column({ type: 'jsonb', name: 'monthly_targets' })
  monthlyTargets: MonthlyValues;

  @Column({ type: 'jsonb' })
  assumptions: {
    volume: number;
    pricePerUnit: number;
    discountRate: number;
  };

  @Column({ type: 'jsonb', name: 'previous_year', nullable: true })
  previousYear?: MonthlyValues;
}
