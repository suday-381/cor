import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RkapCycle } from '../../rkap-cycle/entities/rkap-cycle.entity';
import { Department } from '../../master-data/entities/department.entity';

@Entity('personnel_costs')
export class PersonnelCost {
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

  @Column()
  position: string;

  @Column({ type: 'int' })
  headcount: number;

  @Column({ type: 'decimal', name: 'monthly_salary', precision: 15, scale: 2 })
  monthlySalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  allowances: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  bpjs: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  bonus: number;

  @Column({ type: 'decimal', name: 'total_annual', precision: 18, scale: 2 })
  totalAnnual: number;

  @Column({ type: 'varchar', name: 'cost_category', default: 'opex' })
  costCategory: 'cogs' | 'opex';
}
