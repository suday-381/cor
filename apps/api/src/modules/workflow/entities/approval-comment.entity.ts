import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApprovalStage } from './approval-stage.entity';
import { UserRole } from '@corplan/shared-types';

@Entity('approval_comments')
export class ApprovalComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stage_id' })
  stageId: string;

  @ManyToOne(() => ApprovalStage, (stage) => stage.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stage_id' })
  stage?: ApprovalStage;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_name' })
  userName: string;

  @Column({ type: 'varchar', name: 'user_role' })
  userRole: UserRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;
}
