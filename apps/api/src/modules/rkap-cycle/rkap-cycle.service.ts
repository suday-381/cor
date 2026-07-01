import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RkapCycle } from './entities/rkap-cycle.entity';
import { MacroAssumption } from './entities/macro-assumption.entity';
import { CycleVersion } from './entities/cycle-version.entity';
import { RevenueLineItem } from '../revenue/entities/revenue-line-item.entity';
import { CostLineItem } from '../cost/entities/cost-line-item.entity';
import { CycleStatus, PeriodType } from '@corplan/shared-types';

@Injectable()
export class RkapCycleService {
  constructor(
    @InjectRepository(RkapCycle)
    private readonly rkapCycleRepository: Repository<RkapCycle>,
    @InjectRepository(MacroAssumption)
    private readonly macroAssumptionRepository: Repository<MacroAssumption>,
    @InjectRepository(CycleVersion)
    private readonly cycleVersionRepository: Repository<CycleVersion>,
    @InjectRepository(RevenueLineItem)
    private readonly revenueRepository: Repository<RevenueLineItem>,
    @InjectRepository(CostLineItem)
    private readonly costRepository: Repository<CostLineItem>,
  ) {}

  async findAll(): Promise<RkapCycle[]> {
    return this.rkapCycleRepository.find({
      relations: ['macroAssumptions', 'versions'],
      order: { fiscalYear: 'DESC' },
    });
  }

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async findOne(id: string): Promise<RkapCycle> {
    if (!this.isUuid(id)) {
      throw new NotFoundException(`Siklus RKAP dengan ID ${id} tidak ditemukan`);
    }
    const cycle = await this.rkapCycleRepository.findOne({
      where: { id },
      relations: ['macroAssumptions', 'versions'],
    });
    if (!cycle) {
      throw new NotFoundException(`Siklus RKAP dengan ID ${id} tidak ditemukan`);
    }
    return cycle;
  }

  async create(
    fiscalYear: number,
    periodType: PeriodType,
    macroData: Partial<MacroAssumption>,
    createdBy: string,
  ): Promise<RkapCycle> {
    const existing = await this.rkapCycleRepository.findOne({ where: { fiscalYear } });
    if (existing) {
      throw new ConflictException(`Siklus RKAP untuk tahun anggaran ${fiscalYear} sudah ada`);
    }

    const cycle = new RkapCycle();
    cycle.fiscalYear = fiscalYear;
    cycle.periodType = periodType;
    cycle.status = 'draft';
    cycle.createdBy = createdBy;

    const savedCycle = await this.rkapCycleRepository.save(cycle);

    const assumptions = new MacroAssumption();
    assumptions.cycleId = savedCycle.id;
    assumptions.inflationRate = macroData.inflationRate ?? 0;
    assumptions.exchangeRateUsdIdr = macroData.exchangeRateUsdIdr ?? 15000;
    assumptions.biInterestRate = macroData.biInterestRate ?? 0;
    assumptions.industryGrowthRate = macroData.industryGrowthRate ?? 0;
    assumptions.commodityPrices = macroData.commodityPrices ?? {};
    assumptions.taxRate = macroData.taxRate ?? 22.0;
    
    await this.macroAssumptionRepository.save(assumptions);

    const version = new CycleVersion();
    version.cycleId = savedCycle.id;
    version.version = 1;
    version.createdBy = createdBy;
    version.changeNote = 'Siklus RKAP dibuat';

    await this.cycleVersionRepository.save(version);

    return this.findOne(savedCycle.id);
  }

  async updateStatus(id: string, status: CycleStatus): Promise<RkapCycle> {
    const cycle = await this.findOne(id);
    cycle.status = status;
    if (status === 'locked') {
      cycle.lockedAt = new Date().toISOString();
    }
    await this.rkapCycleRepository.save(cycle);
    return this.findOne(id);
  }

  async updateMacro(id: string, macroData: Partial<MacroAssumption>): Promise<RkapCycle> {
    const cycle = await this.findOne(id);
    if (!cycle.macroAssumptions) {
      throw new NotFoundException(`Asumsi makro untuk siklus ${id} tidak ditemukan`);
    }
    Object.assign(cycle.macroAssumptions, macroData);
    await this.macroAssumptionRepository.save(cycle.macroAssumptions);
    return this.findOne(id);
  }

  async addVersion(id: string, note: string, createdBy: string): Promise<CycleVersion> {
    const cycle = await this.findOne(id);
    const lastVersionNum = cycle.versions && cycle.versions.length > 0 
      ? Math.max(...cycle.versions.map(v => v.version)) 
      : 0;

    const version = new CycleVersion();
    version.cycleId = id;
    version.version = lastVersionNum + 1;
    version.createdBy = createdBy;
    version.changeNote = note;

    return this.cycleVersionRepository.save(version);
  }

  async copyCycle(sourceId: string, targetYear: number, createdBy: string): Promise<RkapCycle> {
    const sourceCycle = await this.findOne(sourceId);
    
    const macroData = sourceCycle.macroAssumptions 
      ? {
          inflationRate: sourceCycle.macroAssumptions.inflationRate,
          exchangeRateUsdIdr: sourceCycle.macroAssumptions.exchangeRateUsdIdr,
          biInterestRate: sourceCycle.macroAssumptions.biInterestRate,
          industryGrowthRate: sourceCycle.macroAssumptions.industryGrowthRate,
          commodityPrices: sourceCycle.macroAssumptions.commodityPrices,
          taxRate: sourceCycle.macroAssumptions.taxRate,
        }
      : {};

    const targetCycle = await this.create(
      targetYear,
      sourceCycle.periodType,
      macroData,
      createdBy,
    );

    // Copy revenue items
    const sourceRevs = await this.revenueRepository.find({ where: { cycleId: sourceId } });
    for (const rev of sourceRevs) {
      const newRev = new RevenueLineItem();
      newRev.cycleId = targetCycle.id;
      newRev.departmentId = rev.departmentId;
      newRev.accountId = rev.accountId;
      newRev.productName = rev.productName;
      newRev.segment = rev.segment;
      newRev.channel = rev.channel;
      newRev.monthlyTargets = { ...rev.monthlyTargets };
      newRev.assumptions = { ...rev.assumptions };
      newRev.previousYear = { ...rev.monthlyTargets };
      await this.revenueRepository.save(newRev);
    }

    // Copy cost items
    const sourceCosts = await this.costRepository.find({ where: { cycleId: sourceId } });
    for (const cost of sourceCosts) {
      const newCost = new CostLineItem();
      newCost.cycleId = targetCycle.id;
      newCost.departmentId = cost.departmentId;
      newCost.accountId = cost.accountId;
      newCost.accountCode = cost.accountCode;
      newCost.accountName = cost.accountName;
      newCost.category = cost.category;
      newCost.monthlyAmounts = { ...cost.monthlyAmounts };
      newCost.previousYear = { ...cost.monthlyAmounts };
      newCost.notes = cost.notes;
      await this.costRepository.save(newCost);
    }

    return this.findOne(targetCycle.id);
  }
}
