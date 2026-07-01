import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApprovalWorkflow } from './approval-workflow.entity';
import { ApprovalComment } from './approval-comment.entity';
import { UserRole, StageStatus } from '@corplan/shared-types';

@Entity('approval_stages')
export class ApprovalStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @ManyToOne(() => ApprovalWorkflow, (workflow) => workflow.stages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow?: ApprovalWorkflow;

  @Column({ name: 'stage_name' })
  stageName: string;

  @Column({ type: 'varchar', name: 'approver_role' })
  approverRole: UserRole;

  @Column({ name: 'approver_user_id', nullable: true })
  approverUserId?: string;

  @Column({ name: 'approver_name', nullable: true })
  approverName?: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: StageStatus;

  @OneToMany(() => ApprovalComment, (comment) => comment.stage, { cascade: true })
  comments?: ApprovalComment[];

  @Column({ nullable: true })
  deadline?: string;

  @Column({ name: 'decided_at', nullable: true })
  decidedAt?: string;
}
