import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AccountType } from '@corplan/shared-types';

@Entity('chart_of_accounts')
export class ChartOfAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    name: 'account_type',
  })
  accountType: AccountType;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => ChartOfAccount, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent?: ChartOfAccount;

  @Column({ default: 1 })
  level: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
