import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RkapCycle } from '../../rkap-cycle/entities/rkap-cycle.entity';
import { Department } from '../../master-data/entities/department.entity';
import { ChartOfAccount } from '../../master-data/entities/chart-of-account.entity';
import { MonthlyValues, CostCategory } from '@corplan/shared-types';

@Entity('cost_line_items')
export class CostLineItem {
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

  @Column({ name: 'account_code' })
  accountCode: string;

  @Column({ name: 'account_name' })
  accountName: string;

  @Column({
    type: 'varchar',
  })
  category: CostCategory;

  @Column({ type: 'jsonb', name: 'monthly_amounts' })
  monthlyAmounts: MonthlyValues;

  @Column({ type: 'jsonb', name: 'previous_year', nullable: true })
  previousYear?: MonthlyValues;

  @Column({ nullable: true })
  notes?: string;
}
