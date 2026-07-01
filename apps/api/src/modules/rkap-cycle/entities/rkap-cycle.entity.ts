import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { CycleStatus, PeriodType } from '@corplan/shared-types';
import { CycleVersion } from './cycle-version.entity';
import { MacroAssumption } from './macro-assumption.entity';

@Entity('rkap_cycles')
export class RkapCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fiscal_year', unique: true })
  fiscalYear: number;

  @Column({
    type: 'varchar',
    name: 'period_type',
    default: 'monthly',
  })
  periodType: PeriodType;

  @Column({
    type: 'varchar',
    default: 'draft',
  })
  status: CycleStatus;

  @OneToOne(() => MacroAssumption, (macro) => macro.cycle, { cascade: true })
  macroAssumptions?: MacroAssumption;

  @OneToMany(() => CycleVersion, (version) => version.cycle, { cascade: true })
  versions?: CycleVersion[];

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @Column({ name: 'locked_at', nullable: true })
  lockedAt?: string;
}
