import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RkapCycle } from '../../rkap-cycle/entities/rkap-cycle.entity';
import { Department } from '../../master-data/entities/department.entity';
import { MonthlyValues } from '@corplan/shared-types';

@Entity('capex_items')
export class CapExItem {
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

  @Column({ name: 'asset_name' })
  assetName: string;

  @Column()
  category: string;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'decimal', name: 'cost_per_unit', precision: 15, scale: 2 })
  costPerUnit: number;

  @Column({ type: 'decimal', name: 'total_cost', precision: 18, scale: 2 })
  totalCost: number;

  @Column({ type: 'int', name: 'useful_life' })
  usefulLife: number;

  @Column({ name: 'depreciation_method', default: 'straight_line' })
  depreciationMethod: 'straight_line' | 'double_declining';

  @Column({
    type: 'varchar',
    name: 'procurement_month',
  })
  procurementMonth: keyof MonthlyValues;

  @Column({ nullable: true })
  notes?: string;
}
