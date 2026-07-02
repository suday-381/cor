import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RkapCycle } from '../../rkap-cycle/entities/rkap-cycle.entity';
import { ApprovalStage } from './approval-stage.entity';

@Entity('approval_workflows')
export class ApprovalWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => RkapCycle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cycle_id' })
  cycle?: RkapCycle;

  @OneToMany(() => ApprovalStage, (stage) => stage.workflow, { cascade: true })
  stages?: ApprovalStage[];

  @Column({ type: 'int', name: 'current_stage_index', default: 0 })
  currentStageIndex: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';

  @Column({ name: 'department_id', nullable: true })
  departmentId?: string;

  @Column({ name: 'submitted_at', nullable: true })
  submittedAt?: string;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: string;

  @Column({ name: 'submission_name', nullable: true })
  submissionName?: string;

  @Column({ name: 'submission_version', type: 'int', default: 1 })
  submissionVersion: number;
}
