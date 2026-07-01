import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PnlSnapshot } from './entities/pnl-snapshot.entity';
import { CashFlowSnapshot } from './entities/cashflow-snapshot.entity';
import { BalanceSheetSnapshot } from './entities/balance-sheet-snapshot.entity';
import { RkapCycle } from '../rkap-cycle/entities/rkap-cycle.entity';
import { RevenueLineItem } from '../revenue/entities/revenue-line-item.entity';
import { CostLineItem } from '../cost/entities/cost-line-item.entity';
import { PersonnelCost } from '../cost/entities/personnel-cost.entity';
import { CapExItem } from '../capex/entities/capex-item.entity';
import { MonthlyValues, WorkingCapitalAssumptions } from '@corplan/shared-types';

@Injectable()
export class ProjectionsService {
  constructor(
    @InjectRepository(PnlSnapshot)
    private readonly pnlRepository: Repository<PnlSnapshot>,
    @InjectRepository(CashFlowSnapshot)
    private readonly cashFlowRepository: Repository<CashFlowSnapshot>,
    @InjectRepository(BalanceSheetSnapshot)
    private readonly balanceSheetRepository: Repository<BalanceSheetSnapshot>,
    @InjectRepository(RkapCycle)
    private readonly cycleRepository: Repository<RkapCycle>,
    @InjectRepository(RevenueLineItem)
    private readonly revenueRepository: Repository<RevenueLineItem>,
    @InjectRepository(CostLineItem)
    private readonly costRepository: Repository<CostLineItem>,
    @InjectRepository(PersonnelCost)
    private readonly personnelRepository: Repository<PersonnelCost>,
    @InjectRepository(CapExItem)
    private readonly capexRepository: Repository<CapExItem>,
  ) {}

  private isUuid(str: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async getPnl(cycleId: string): Promise<PnlSnapshot> {
    if (!this.isUuid(cycleId)) {
      throw new NotFoundException(`Snapshot P&L untuk siklus ${cycleId} belum tersedia. Silakan jalankan kalkulasi.`);
    }
    const snapshot = await this.pnlRepository.findOne({
      where: { cycleId },
      order: { calculatedAt: 'DESC' },
    });
    if (!snapshot) {
      throw new NotFoundException(`Snapshot P&L untuk siklus ${cycleId} belum tersedia. Silakan jalankan kalkulasi.`);
    }
    return snapshot;
  }

  async getCashFlow(cycleId: string): Promise<CashFlowSnapshot> {
    if (!this.isUuid(cycleId)) {
      throw new NotFoundException(`Snapshot Cash Flow untuk siklus ${cycleId} belum tersedia. Silakan jalankan kalkulasi.`);
    }
    const snapshot = await this.cashFlowRepository.findOne({
      where: { cycleId },
      order: { calculatedAt: 'DESC' },
    });
    if (!snapshot) {
      throw new NotFoundException(`Snapshot Cash Flow untuk siklus ${cycleId} belum tersedia. Silakan jalankan kalkulasi.`);
    }
    return snapshot;
  }

  async getBalanceSheet(cycleId: string): Promise<BalanceSheetSnapshot> {
    if (!this.isUuid(cycleId)) {
      throw new NotFoundException(`Snapshot Balance Sheet untuk siklus ${cycleId} belum tersedia. Silakan jalankan kalkulasi.`);
    }
    const snapshot = await this.balanceSheetRepository.findOne({
      where: { cycleId },
      order: { calculatedAt: 'DESC' },
    });
    if (!snapshot) {
      throw new NotFoundException(`Snapshot Balance Sheet untuk siklus ${cycleId} belum tersedia. Silakan jalankan kalkulasi.`);
    }
    return snapshot;
  }

  async recalculate(cycleId: string, wc?: WorkingCapitalAssumptions): Promise<{
    pnl: PnlSnapshot;
    cashflow: CashFlowSnapshot;
    balancesheet: BalanceSheetSnapshot;
  }> {
    if (!this.isUuid(cycleId)) {
      throw new NotFoundException(`Siklus RKAP dengan ID ${cycleId} tidak ditemukan`);
    }
    const cycle = await this.cycleRepository.findOne({
      where: { id: cycleId },
      relations: ['macroAssumptions', 'versions'],
    });
    if (!cycle) {
      throw new NotFoundException(`Siklus RKAP dengan ID ${cycleId} tidak ditemukan`);
    }

    const revenues = await this.revenueRepository.find({ where: { cycleId } });
    const costs = await this.costRepository.find({ where: { cycleId } });
    const personnel = await this.personnelRepository.find({ where: { cycleId } });
    const capex = await this.capexRepository.find({ where: { cycleId } });

    const currentWc = wc || { dso: 45, dio: 30, dpo: 35 };

    const payload = {
      macroAssumptions: cycle.macroAssumptions,
      revenues,
      costs,
      personnel,
      capex,
      wcAssumptions: currentWc,
    };

    let calcResult: any = null;
    const calcEngineUrl = process.env.CALC_ENGINE_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${calcEngineUrl}/calculate/all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        calcResult = await response.json();
      } else {
        console.warn(`Calc Engine returned error ${response.status}. Using fallback local calculation.`);
      }
    } catch (err) {
      console.warn(`Could not connect to Calc Engine at ${calcEngineUrl}: ${err.message}. Using fallback local calculation.`);
    }

    if (!calcResult) {
      calcResult = this.calculateFallback(payload);
    }

    const versionNum = cycle.versions && cycle.versions.length > 0 
      ? Math.max(...cycle.versions.map(v => v.version)) 
      : 1;

    // Save P&L Snapshot
    let pnl = await this.pnlRepository.findOne({ where: { cycleId, version: versionNum } });
    if (!pnl) {
      pnl = new PnlSnapshot();
      pnl.cycleId = cycleId;
      pnl.version = versionNum;
    }
    pnl.summary = calcResult.pnl.summary;
    pnl.byDepartment = calcResult.pnl.byDepartment || {};
    pnl.calculatedAt = new Date().toISOString();
    const savedPnl = await this.pnlRepository.save(pnl);

    // Save Cash Flow Snapshot
    let cf = await this.cashFlowRepository.findOne({ where: { cycleId, version: versionNum } });
    if (!cf) {
      cf = new CashFlowSnapshot();
      cf.cycleId = cycleId;
      cf.version = versionNum;
    }
    cf.operatingActivities = calcResult.cashflow.operatingActivities;
    cf.investingActivities = calcResult.cashflow.investingActivities;
    cf.financingActivities = calcResult.cashflow.financingActivities;
    cf.netCashFlow = calcResult.cashflow.netCashFlow;
    cf.openingCash = calcResult.cashflow.openingCash;
    cf.closingCash = calcResult.cashflow.closingCash;
    cf.wcAssumptions = calcResult.cashflow.wcAssumptions;
    cf.calculatedAt = new Date().toISOString();
    const savedCf = await this.cashFlowRepository.save(cf);

    // Save Balance Sheet Snapshot
    let bs = await this.balanceSheetRepository.findOne({ where: { cycleId, version: versionNum } });
    if (!bs) {
      bs = new BalanceSheetSnapshot();
      bs.cycleId = cycleId;
      bs.version = versionNum;
    }
    bs.currentAssets = calcResult.balancesheet.currentAssets;
    bs.nonCurrentAssets = calcResult.balancesheet.nonCurrentAssets;
    bs.totalAssets = calcResult.balancesheet.totalAssets;
    bs.currentLiabilities = calcResult.balancesheet.currentLiabilities;
    bs.longTermLiabilities = calcResult.balancesheet.longTermLiabilities;
    bs.totalLiabilities = calcResult.balancesheet.totalLiabilities;
    bs.equity = calcResult.balancesheet.equity;
    bs.totalLiabilitiesAndEquity = calcResult.balancesheet.totalLiabilitiesAndEquity;
    bs.isBalanced = calcResult.balancesheet.isBalanced;
    bs.discrepancy = calcResult.balancesheet.discrepancy;
    bs.financialRatios = calcResult.balancesheet.financialRatios;
    bs.calculatedAt = new Date().toISOString();
    const savedBs = await this.balanceSheetRepository.save(bs);

    return {
      pnl: savedPnl,
      cashflow: savedCf,
      balancesheet: savedBs,
    };
  }

  private calculateFallback(payload: any) {
    const createEmptyMv = (): MonthlyValues => ({
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
    });

    const monthKeys: (keyof MonthlyValues)[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    const macro = payload.macroAssumptions || { taxRate: 22.0 };
    const revs = payload.revenues || [];
    const costs = payload.costs || [];
    const personnel = payload.personnel || [];
    const capex = payload.capex || [];
    const wc = payload.wcAssumptions || { dso: 45, dio: 30, dpo: 35 };

    // P&L calculation
    const grossRevenue = createEmptyMv();
    revs.forEach((r: any) => {
      monthKeys.forEach(m => {
        grossRevenue[m] += Number(r.monthlyTargets?.[m] || 0);
      });
    });

    const cogs = createEmptyMv();
    costs.filter((c: any) => c.category === 'variable' || c.departmentId === 'd-prod').forEach((c: any) => {
      monthKeys.forEach(m => {
        cogs[m] += Number(c.monthlyAmounts?.[m] || 0);
      });
    });
    monthKeys.forEach(m => {
      if (cogs[m] === 0) cogs[m] = Math.round(grossRevenue[m] * 0.52);
    });

    const grossProfit = createEmptyMv();
    monthKeys.forEach(m => {
      grossProfit[m] = grossRevenue[m] - cogs[m];
    });

    const opex = createEmptyMv();
    costs.filter((c: any) => c.category !== 'variable' && c.departmentId !== 'd-prod').forEach((c: any) => {
      monthKeys.forEach(m => {
        opex[m] += Number(c.monthlyAmounts?.[m] || 0);
      });
    });
    personnel.forEach((p: any) => {
      const monthlyP = Math.round(Number(p.totalAnnual || 0) / 12);
      monthKeys.forEach(m => {
        opex[m] += monthlyP;
      });
    });

    const ebitda = createEmptyMv();
    monthKeys.forEach(m => {
      ebitda[m] = grossProfit[m] - opex[m];
    });

    const depreciation = createEmptyMv();
    monthKeys.forEach(m => {
      depreciation[m] = 380000000;
    });
    capex.forEach((item: any) => {
      const monthlyDep = Math.round(Number(item.totalCost || 0) / (Number(item.usefulLife || 5) * 12));
      const startIdx = monthKeys.indexOf(item.procurementMonth || 'jan');
      monthKeys.forEach((m, idx) => {
        if (idx >= startIdx) {
          depreciation[m] += monthlyDep;
        }
      });
    });

    const ebit = createEmptyMv();
    monthKeys.forEach(m => {
      ebit[m] = ebitda[m] - depreciation[m];
    });

    const interestExpense = createEmptyMv();
    monthKeys.forEach(m => {
      interestExpense[m] = 125000000;
    });

    const ebt = createEmptyMv();
    monthKeys.forEach(m => {
      ebt[m] = ebit[m] - interestExpense[m];
    });

    const taxRate = Number(macro.taxRate || 22) / 100;
    const incomeTax = createEmptyMv();
    monthKeys.forEach(m => {
      incomeTax[m] = Math.round(Math.max(0, ebt[m]) * taxRate);
    });

    const netIncome = createEmptyMv();
    monthKeys.forEach(m => {
      netIncome[m] = ebt[m] - incomeTax[m];
    });

    const pnl = {
      summary: {
        grossRevenue, cogs, grossProfit, operatingExpenses: opex, ebitda, depreciation, ebit, interestExpense, ebt, incomeTax, netIncome
      },
      byDepartment: {}
    };

    // Cash Flow Calculation
    const receivablesChange = createEmptyMv();
    const inventoryChange = createEmptyMv();
    const payablesChange = createEmptyMv();

    monthKeys.forEach((m, idx) => {
      const prevRev = idx > 0 ? grossRevenue[monthKeys[idx - 1]] : grossRevenue.dec;
      receivablesChange[m] = Math.round((prevRev - grossRevenue[m]) * (wc.dso / 360));

      const prevCogs = idx > 0 ? cogs[monthKeys[idx - 1]] : cogs.dec;
      inventoryChange[m] = Math.round((prevCogs - cogs[m]) * (wc.dio / 360));

      payablesChange[m] = Math.round((cogs[m] - prevCogs) * (wc.dpo / 360));
    });

    const depreciationAdj = depreciation;
    const otherAdjustments = createEmptyMv();
    monthKeys.forEach(m => {
      otherAdjustments[m] = 50000000;
    });

    const totalOperating = createEmptyMv();
    monthKeys.forEach(m => {
      totalOperating[m] = netIncome[m] + depreciationAdj[m] + receivablesChange[m] + inventoryChange[m] + payablesChange[m] + otherAdjustments[m];
    });

    const capexFlow = createEmptyMv();
    capex.forEach((item: any) => {
      const pMonth = (item.procurementMonth || 'jan') as keyof MonthlyValues;
      capexFlow[pMonth] -= Number(item.totalCost || 0);
    });

    const assetDisposal = createEmptyMv();
    assetDisposal.mar = 50000000;
    assetDisposal.aug = 100000000;

    const investments = createEmptyMv();
    const totalInvesting = createEmptyMv();
    monthKeys.forEach(m => {
      totalInvesting[m] = capexFlow[m] + assetDisposal[m] + investments[m];
    });

    const loanProceeds = createEmptyMv();
    loanProceeds.jan = 5000000000;
    const loanRepayments = createEmptyMv();
    monthKeys.forEach(m => {
      loanRepayments[m] = -420000000;
    });
    const equityIssuance = createEmptyMv();
    const dividendsPaid = createEmptyMv();
    dividendsPaid.apr = -2000000000;

    const totalFinancing = createEmptyMv();
    monthKeys.forEach(m => {
      totalFinancing[m] = loanProceeds[m] + loanRepayments[m] + equityIssuance[m] + dividendsPaid[m];
    });

    const netCashFlow = createEmptyMv();
    monthKeys.forEach(m => {
      netCashFlow[m] = totalOperating[m] + totalInvesting[m] + totalFinancing[m];
    });

    const openingCash = createEmptyMv();
    const closingCash = createEmptyMv();
    let currentCash = 15000000000;

    monthKeys.forEach(m => {
      openingCash[m] = currentCash;
      currentCash += netCashFlow[m];
      closingCash[m] = currentCash;
    });

    const cashflow = {
      operatingActivities: {
        netIncome, depreciationAdj, receivablesChange, inventoryChange, payablesChange, otherAdjustments, totalOperating
      },
      investingActivities: {
        capex: capexFlow, assetDisposal, investments, totalInvesting
      },
      financingActivities: {
        loanProceeds, loanRepayments, equityIssuance, dividendsPaid, totalFinancing
      },
      netCashFlow, openingCash, closingCash,
      wcAssumptions: wc,
    };

    // Balance Sheet calculation
    const accountsReceivable = createEmptyMv();
    const inventory = createEmptyMv();
    const prepaidExpenses = createEmptyMv();
    monthKeys.forEach(m => {
      accountsReceivable[m] = Math.round(grossRevenue[m] * (wc.dso / 30));
      inventory[m] = Math.round(cogs[m] * (wc.dio / 30));
      prepaidExpenses[m] = 250000000;
    });

    const totalCurrentAssets = createEmptyMv();
    monthKeys.forEach(m => {
      totalCurrentAssets[m] = closingCash[m] + accountsReceivable[m] + inventory[m] + prepaidExpenses[m];
    });

    const fixedAssets = createEmptyMv();
    const accumulatedDepreciation = createEmptyMv();
    const netFixedAssets = createEmptyMv();
    let baseFa = 25000000000;
    let baseAccDep = 5000000000;

    monthKeys.forEach(m => {
      baseFa += Math.abs(capexFlow[m]);
      baseAccDep += depreciation[m];
      fixedAssets[m] = baseFa;
      accumulatedDepreciation[m] = baseAccDep;
      netFixedAssets[m] = baseFa - baseAccDep;
    });

    const longTermInvestments = createEmptyMv();
    const otherAssets = createEmptyMv();
    monthKeys.forEach(m => {
      longTermInvestments[m] = 3000000000;
      otherAssets[m] = 500000000;
    });

    const totalNonCurrentAssets = createEmptyMv();
    monthKeys.forEach(m => {
      totalNonCurrentAssets[m] = netFixedAssets[m] + longTermInvestments[m] + otherAssets[m];
    });

    const totalAssets = createEmptyMv();
    monthKeys.forEach(m => {
      totalAssets[m] = totalCurrentAssets[m] + totalNonCurrentAssets[m];
    });

    const accountsPayable = createEmptyMv();
    const taxPayable = createEmptyMv();
    const accruedExpenses = createEmptyMv();
    const shortTermDebt = createEmptyMv();

    monthKeys.forEach(m => {
      accountsPayable[m] = Math.round(cogs[m] * (wc.dpo / 30));
      taxPayable[m] = Math.round(incomeTax[m] * 0.5);
      accruedExpenses[m] = 800000000;
      shortTermDebt[m] = 2000000000;
    });

    const totalCurrentLiabilities = createEmptyMv();
    monthKeys.forEach(m => {
      totalCurrentLiabilities[m] = accountsPayable[m] + taxPayable[m] + accruedExpenses[m] + shortTermDebt[m];
    });

    const longTermDebt = createEmptyMv();
    const bonds = createEmptyMv();
    const employeeBenefits = createEmptyMv();

    let baseLtDebt = 10000000000;
    monthKeys.forEach(m => {
      baseLtDebt += loanProceeds[m] + loanRepayments[m];
      longTermDebt[m] = baseLtDebt;
      bonds[m] = 5000000000;
      employeeBenefits[m] = 1200000000;
    });

    const totalLongTermLiabilities = createEmptyMv();
    monthKeys.forEach(m => {
      totalLongTermLiabilities[m] = longTermDebt[m] + bonds[m] + employeeBenefits[m];
    });

    const totalLiabilities = createEmptyMv();
    monthKeys.forEach(m => {
      totalLiabilities[m] = totalCurrentLiabilities[m] + totalLongTermLiabilities[m];
    });

    const shareCapital = createEmptyMv();
    const retainedEarnings = createEmptyMv();
    const reserves = createEmptyMv();

    let baseRe = 8000000000;
    monthKeys.forEach(m => {
      baseRe += netIncome[m] + dividendsPaid[m];
      shareCapital[m] = 10000000000;
      retainedEarnings[m] = baseRe;
      reserves[m] = 1500000000;
    });

    const totalEquity = createEmptyMv();
    monthKeys.forEach(m => {
      totalEquity[m] = shareCapital[m] + retainedEarnings[m] + reserves[m];
    });

    const totalLiabilitiesAndEquity = createEmptyMv();
    monthKeys.forEach(m => {
      totalLiabilitiesAndEquity[m] = totalLiabilities[m] + totalEquity[m];
    });

    const discrepancy = createEmptyMv();
    monthKeys.forEach(m => {
      discrepancy[m] = totalAssets[m] - totalLiabilitiesAndEquity[m];
    });

    const currentRatio = createEmptyMv();
    const debtToEquity = createEmptyMv();
    const roe = createEmptyMv();
    const roa = createEmptyMv();

    monthKeys.forEach(m => {
      currentRatio[m] = parseFloat((totalCurrentAssets[m] / totalCurrentLiabilities[m]).toFixed(2));
      debtToEquity[m] = parseFloat((totalLiabilities[m] / totalEquity[m]).toFixed(2));
      roe[m] = parseFloat(((netIncome[m] * 12) / totalEquity[m] * 100).toFixed(1));
      roa[m] = parseFloat(((netIncome[m] * 12) / totalAssets[m] * 100).toFixed(1));
    });

    const balancesheet = {
      currentAssets: { cashAndEquivalents: closingCash, accountsReceivable, inventory, prepaidExpenses, totalCurrentAssets },
      nonCurrentAssets: { fixedAssets, accumulatedDepreciation, netFixedAssets, longTermInvestments, otherAssets, totalNonCurrentAssets },
      totalAssets,
      currentLiabilities: { accountsPayable, taxPayable, accruedExpenses, shortTermDebt, totalCurrentLiabilities },
      longTermLiabilities: { longTermDebt, bonds, employeeBenefits, totalLongTermLiabilities },
      totalLiabilities,
      equity: { shareCapital, retainedEarnings, reserves, totalEquity },
      totalLiabilitiesAndEquity,
      isBalanced: Object.values(discrepancy).every(v => Math.abs(v) < 1000),
      discrepancy,
      financialRatios: { currentRatio, debtToEquity, roe, roa }
    };

    return { pnl, cashflow, balancesheet };
  }
}
