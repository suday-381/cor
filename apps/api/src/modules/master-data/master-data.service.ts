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
    const count = await this.departmentRepository.count();
    if (count > 0) return;

    const depts = [
      { code: 'DIR', name: 'Direksi', isRevenueCenter: false, sortOrder: 1, headCount: 5 },
      { code: 'FIN', name: 'Finance & Accounting', isRevenueCenter: false, sortOrder: 2, headCount: 12 },
      { code: 'SAL', name: 'Sales & Marketing', isRevenueCenter: true, sortOrder: 3, headCount: 25 },
      { code: 'OPS', name: 'Operations', isRevenueCenter: false, sortOrder: 4, headCount: 45 },
      { code: 'HRD', name: 'Human Resources & GA', isRevenueCenter: false, sortOrder: 5, headCount: 8 },
      { code: 'IT', name: 'Information Technology', isRevenueCenter: false, sortOrder: 6, headCount: 10 },
      { code: 'PRD', name: 'Production', isRevenueCenter: false, sortOrder: 7, headCount: 60 },
    ];

    for (const d of depts) {
      await this.departmentRepository.save(this.departmentRepository.create(d));
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
    const finDept = depts.find((d) => d.code === 'FIN');
    const dirDept = depts.find((d) => d.code === 'DIR');

    const users = [
      { email: 'admin@corplan.id', name: 'Budi Santoso', role: 'super_admin' as const, departmentId: finDept?.id, isActive: true },
      { email: 'cfo@corplan.id', name: 'Diana Wijaya', role: 'cfo' as const, departmentId: dirDept?.id, isActive: true },
      { email: 'finance@corplan.id', name: 'Rina Hartati', role: 'finance_manager' as const, departmentId: finDept?.id, isActive: true },
    ];

    const passwordHash = await bcrypt.hash('password123', 10);
    for (const u of users) {
      await this.userRepository.save(
        this.userRepository.create({
          ...u,
          passwordHash,
        }),
      );
    }
  }
}
