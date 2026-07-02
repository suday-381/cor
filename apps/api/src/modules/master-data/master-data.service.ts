import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MasterDataService implements OnModuleInit {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(ChartOfAccount)
    private coaRepository: Repository<ChartOfAccount>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedDepartments();
    await this.seedCoA();
    await this.seedUsers();
  }

  async findAllDepartments(): Promise<Department[]> {
    return this.departmentRepository.find({ order: { sortOrder: 'ASC' } });
  }

  async findAllCoA(): Promise<ChartOfAccount[]> {
    return this.coaRepository.find({ order: { code: 'ASC' } });
  }

  private async seedDepartments() {
    const hasNewSeed = await this.departmentRepository.findOne({ where: { code: 'DIV_MBS' } });
    if (!hasNewSeed) {
      await this.departmentRepository.query(`
        TRUNCATE TABLE users, departments, approval_workflows, approval_stages, approval_comments,
        revenue_line_items, cost_line_items, personnel_costs, capex_items,
        pnl_snapshots, cashflow_snapshots, balance_sheet_snapshots CASCADE;
      `);
    } else {
      return;
    }

    const divisions = [
      { code: 'DIV_CORSEC_IT', name: 'Corporate Secretary & IT', sortOrder: 1 },
      { code: 'DIV_IA', name: 'Internal Audit', sortOrder: 2 },
      { code: 'DIV_FIN_RISK', name: 'Finance & Risk Management', sortOrder: 3 },
      { code: 'DIV_PLM', name: 'Procurement, Logistic & Managed Service', sortOrder: 4 },
      { code: 'DIV_HCC', name: 'Human Capital & Compliances', sortOrder: 5 },
      { code: 'DIV_OPS', name: 'Operational', sortOrder: 6 },
      { code: 'DIV_OPS_SUPP', name: 'Operational Support', sortOrder: 7 },
      { code: 'DIV_BDS', name: 'Business Development & Support', sortOrder: 8 },
      { code: 'DIV_MBS', name: 'Marketing & Business Sales', sortOrder: 9 },
    ];

    const childDepts: Record<string, { code: string; name: string; isRevenueCenter?: boolean }[]> = {
      DIV_CORSEC_IT: [
        { code: 'DEPT_CORCOM', name: 'Dept Corporate Communication' },
        { code: 'DEPT_CSP', name: 'Dept Corporate Strategic Planning' },
        { code: 'DEPT_IT', name: 'Dept Information Technology' }
      ],
      DIV_IA: [
        { code: 'DEPT_IA', name: 'Internal Audit' }
      ],
      DIV_FIN_RISK: [
        { code: 'DEPT_FIN', name: 'Dept Finance' },
        { code: 'DEPT_RISK', name: 'Dept Risk Management' }
      ],
      DIV_PLM: [
        { code: 'DEPT_PROC', name: 'Dept Procurement' },
        { code: 'DEPT_OPS_PLM', name: 'Dept Operational' },
        { code: 'DEPT_LOG', name: 'Dept Logistic' }
      ],
      DIV_HCC: [
        { code: 'DEPT_PERS', name: 'Dept Personalia' },
        { code: 'DEPT_HC', name: 'Dept Human Capital' },
        { code: 'DEPT_COMP', name: 'Dept Compliance' }
      ],
      DIV_OPS: [
        { code: 'DEPT_OPS', name: 'Operational' }
      ],
      DIV_OPS_SUPP: [
        { code: 'DEPT_OPS_SUPP', name: 'Operational Support' }
      ],
      DIV_BDS: [
        { code: 'DEPT_BDS', name: 'Business Development & Support', isRevenueCenter: true }
      ],
      DIV_MBS: [
        { code: 'DEPT_MBS', name: 'Marketing & Business Sales', isRevenueCenter: true }
      ]
    };

    let order = 1;
    for (const divData of divisions) {
      const division = await this.departmentRepository.save(
        this.departmentRepository.create({
          code: divData.code,
          name: divData.name,
          isRevenueCenter: false,
          sortOrder: order++,
        })
      );

      const children = childDepts[divData.code] || [];
      for (const child of children) {
        await this.departmentRepository.save(
          this.departmentRepository.create({
            code: child.code,
            name: child.name,
            isRevenueCenter: child.isRevenueCenter || false,
            parentId: division.id,
            sortOrder: order++,
          })
        );
      }
    }
  }

  private async seedCoA() {
    const count = await this.coaRepository.count();
    if (count > 0) return;

    const coaItems = [
      { code: '4000', name: 'Pendapatan Usaha', accountType: 'revenue' as const, level: 1 },
      { code: '4100', name: 'Penjualan Produk A', accountType: 'revenue' as const, level: 2 },
      { code: '4200', name: 'Penjualan Produk B', accountType: 'revenue' as const, level: 2 },
      { code: '4300', name: 'Pendapatan Jasa', accountType: 'revenue' as const, level: 2 },
      { code: '5000', name: 'Harga Pokok Penjualan', accountType: 'expense' as const, level: 1 },
      { code: '5100', name: 'Bahan Baku', accountType: 'expense' as const, level: 2 },
      { code: '5200', name: 'Tenaga Kerja Langsung', accountType: 'expense' as const, level: 2 },
      { code: '5300', name: 'Overhead Produksi', accountType: 'expense' as const, level: 2 },
      { code: '6000', name: 'Beban Operasional', accountType: 'expense' as const, level: 1 },
      { code: '6100', name: 'Gaji & Tunjangan', accountType: 'expense' as const, level: 2 },
      { code: '6200', name: 'Beban Marketing', accountType: 'expense' as const, level: 2 },
      { code: '6300', name: 'Beban Administrasi & Umum', accountType: 'expense' as const, level: 2 },
      { code: '6400', name: 'Beban Perjalanan Dinas', accountType: 'expense' as const, level: 2 },
      { code: '6500', name: 'Beban Sewa', accountType: 'expense' as const, level: 2 },
      { code: '6600', name: 'Beban Utilitas', accountType: 'expense' as const, level: 2 },
      { code: '6700', name: 'Beban Depresiasi', accountType: 'expense' as const, level: 2 },
    ];

    for (const item of coaItems) {
      await this.coaRepository.save(this.coaRepository.create(item));
    }
  }

  private async seedUsers() {
    const count = await this.userRepository.count();
    if (count > 0) return;

    const depts = await this.departmentRepository.find();
    const getDeptId = (code: string) => depts.find(d => d.code === code)?.id;

    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
      // Admin & CFO
      { email: 'admin@corplan.id', name: 'Budi Santoso', role: 'super_admin' as const, departmentId: getDeptId('DIV_CORSEC_IT') },
      { email: 'cfo@corplan.id', name: 'Diana Wijaya', role: 'cfo' as const, departmentId: getDeptId('DIV_FIN_RISK') },

      // CSP Approval
      { email: 'csp@corplan.id', name: 'Hendra Wijaya', role: 'csp' as const, departmentId: getDeptId('DEPT_CSP') },

      // Divisi 1: Corporate Secretary & IT
      { email: 'gm.corsec_it@corplan.id', name: 'Gerry Mahendra (GM CorSec)', role: 'gm' as const, departmentId: getDeptId('DIV_CORSEC_IT') },
      { email: 'bo.corcom@corplan.id', name: 'Rian Corcom (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_CORCOM') },
      { email: 'bo.it@corplan.id', name: 'Andi IT (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_IT') },

      // Divisi 2: Internal Audit
      { email: 'gm.ia@corplan.id', name: 'Indra Aris (GM IA)', role: 'gm' as const, departmentId: getDeptId('DIV_IA') },
      { email: 'bo.ia@corplan.id', name: 'Bayu IA (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_IA') },

      // Divisi 3: Finance & Risk Management
      { email: 'gm.fin_risk@corplan.id', name: 'Ferry Rian (GM Finance)', role: 'gm' as const, departmentId: getDeptId('DIV_FIN_RISK') },
      { email: 'bo.finance@corplan.id', name: 'Rina Finance (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_FIN') },
      { email: 'bo.risk@corplan.id', name: 'Rudi Risk (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_RISK') },

      // Divisi 4: Procurement, Logistic & Managed Service
      { email: 'gm.plm@corplan.id', name: 'Putra Logistik (GM PLM)', role: 'gm' as const, departmentId: getDeptId('DIV_PLM') },
      { email: 'bo.proc@corplan.id', name: 'Prima Proc (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_PROC') },
      { email: 'bo.ops_plm@corplan.id', name: 'Oky Ops PLM (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_OPS_PLM') },
      { email: 'bo.log@corplan.id', name: 'Lia Logistik (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_LOG') },

      // Divisi 5: Human Capital & Compliances
      { email: 'gm.hcc@corplan.id', name: 'Helmi Compliances (GM HCC)', role: 'gm' as const, departmentId: getDeptId('DIV_HCC') },
      { email: 'bo.personal@corplan.id', name: 'Pipit Personalia (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_PERS') },
      { email: 'bo.hc@corplan.id', name: 'Hani HC (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_HC') },
      { email: 'bo.compliance@corplan.id', name: 'Chandra Compliance (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_COMP') },

      // Divisi 6: Operational
      { email: 'gm.ops@corplan.id', name: 'Omar Operational (GM Ops)', role: 'gm' as const, departmentId: getDeptId('DIV_OPS') },
      { email: 'bo.ops@corplan.id', name: 'Oman Ops (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_OPS') },

      // Divisi 7: Operational Support
      { email: 'gm.ops_supp@corplan.id', name: 'Osward Support (GM Supp)', role: 'gm' as const, departmentId: getDeptId('DIV_OPS_SUPP') },
      { email: 'bo.ops_supp@corplan.id', name: 'Soni Supp (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_OPS_SUPP') },

      // Divisi 8: Business Development & Support
      { email: 'gm.bds@corplan.id', name: 'Bambang Dev (GM BDS)', role: 'gm' as const, departmentId: getDeptId('DIV_BDS') },
      { email: 'bo.bds@corplan.id', name: 'Beny BDS (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_BDS') },

      // Divisi 9: Marketing & Business Sales
      { email: 'gm.mbs@corplan.id', name: 'Mira Marketing (GM MBS)', role: 'gm' as const, departmentId: getDeptId('DIV_MBS') },
      { email: 'bo.mbs@corplan.id', name: 'Moni MBS (BO)', role: 'budget_owner' as const, departmentId: getDeptId('DEPT_MBS') },
    ];

    for (const u of users) {
      await this.userRepository.save(
        this.userRepository.create({
          ...u,
          passwordHash,
          isActive: true,
        }),
      );
    }
  }
}
