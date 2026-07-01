import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RkapCycle } from './rkap-cycle.entity';

@Entity('cycle_versions')
export class CycleVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => RkapCycle, (cycle) => cycle.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cycle_id' })
  cycle?: RkapCycle;

  @Column({ type: 'int' })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'change_note' })
  changeNote: string;
}
