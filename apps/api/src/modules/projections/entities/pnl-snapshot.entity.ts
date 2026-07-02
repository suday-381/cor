import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { RkapCycle } from '../../rkap-cycle/entities/rkap-cycle.entity';
import { PnlSummary } from '@corplan/shared-types';

@Entity('pnl_snapshots')
export class PnlSnapshot {
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

  @Column({ type: 'jsonb' })
  summary: PnlSummary;

  @Column({ type: 'jsonb', name: 'by_department' })
  byDepartment: Record<string, PnlSummary>;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: string;
}
