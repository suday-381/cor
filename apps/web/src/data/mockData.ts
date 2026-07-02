import type {
  User, Department, ChartOfAccount, RkapCycle, RevenueLineItem,
  CostLineItem, PersonnelCost, PnlSnapshot, CashFlowProjection,
  BalanceSheetSnapshot, ApprovalWorkflow, Notification, AuditLog,
  MonthlyValues, CapExItem,
} from '@/types';

// ============================================================
//  Helpers
// ============================================================

const mv = (values: number[]): MonthlyValues => ({
  jan: values[0], feb: values[1], mar: values[2], apr: values[3],
  may: values[4], jun: values[5], jul: values[6], aug: values[7],
  sep: values[8], oct: values[9], nov: values[10], dec: values[11],
});

const scale = (base: number[], factor: number): MonthlyValues =>
  mv(base.map(v => Math.round(v * factor)));

const sumMv = (...items: MonthlyValues[]): MonthlyValues => {
  const result = mv(new Array(12).fill(0));
  const keys = Object.keys(result) as (keyof MonthlyValues)[];
  for (const item of items) {
    for (const k of keys) result[k] += item[k];
  }
  return result;
};

const negateMv = (v: MonthlyValues): MonthlyValues =>
  mv(Object.values(v).map(x => -x));

const subtractMv = (a: MonthlyValues, b: MonthlyValues): MonthlyValues =>
  mv(Object.values(a).map((v, i) => v - Object.values(b)[i]));

// ============================================================
//  Users
// ============================================================

export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@corplan.id', name: 'Budi Santoso', role: 'super_admin', department: 'IT', departmentId: 'd-it', isActive: true, lastLogin: '2026-05-23T08:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'u2', email: 'cfo@corplan.id', name: 'Diana Wijaya', role: 'cfo', department: 'Direksi', departmentId: 'd-dir', isActive: true, lastLogin: '2026-05-22T14:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'u3', email: 'finance@corplan.id', name: 'Rina Hartati', role: 'finance_manager', department: 'Finance', departmentId: 'd-fin', isActive: true, lastLogin: '2026-05-23T07:30:00Z', createdAt: '2025-02-01T00:00:00Z' },
  { id: 'u4', email: 'ops@corplan.id', name: 'Agus Pratama', role: 'dept_head', department: 'Operations', departmentId: 'd-ops', isActive: true, lastLogin: '2026-05-21T09:00:00Z', createdAt: '2025-03-01T00:00:00Z' },
  { id: 'u5', email: 'sales@corplan.id', name: 'Siti Rahayu', role: 'dept_head', department: 'Sales & Marketing', departmentId: 'd-sales', isActive: true, lastLogin: '2026-05-22T10:00:00Z', createdAt: '2025-03-01T00:00:00Z' },
  { id: 'u6', email: 'hr@corplan.id', name: 'Bambang Setiawan', role: 'dept_head', department: 'HR & GA', departmentId: 'd-hr', isActive: true, lastLogin: '2026-05-20T11:00:00Z', createdAt: '2025-03-15T00:00:00Z' },
  { id: 'u7', email: 'staff1@corplan.id', name: 'Dewi Lestari', role: 'staff_finance', department: 'Finance', departmentId: 'd-fin', isActive: true, lastLogin: '2026-05-23T08:10:00Z', createdAt: '2025-04-01T00:00:00Z' },
  { id: 'u8', email: 'komisaris@corplan.id', name: 'Ir. Hendra Gunawan', role: 'viewer', department: 'Komisaris', departmentId: 'd-dir', isActive: true, lastLogin: '2026-05-15T08:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
];

// ============================================================
//  Departments
// ============================================================

export const mockDepartments: Department[] = [
  { id: 'd-dir', code: 'DIR', name: 'Direksi', isRevenueCenter: false, sortOrder: 1, headCount: 5 },
  { id: 'd-fin', code: 'FIN', name: 'Finance & Accounting', isRevenueCenter: false, sortOrder: 2, headCount: 12 },
  { id: 'd-sales', code: 'SAL', name: 'Sales & Marketing', isRevenueCenter: true, sortOrder: 3, headCount: 25 },
  { id: 'd-ops', code: 'OPS', name: 'Operations', isRevenueCenter: false, sortOrder: 4, headCount: 45 },
  { id: 'd-hr', code: 'HRD', name: 'Human Resources & GA', isRevenueCenter: false, sortOrder: 5, headCount: 8 },
  { id: 'd-it', code: 'IT', name: 'Information Technology', isRevenueCenter: false, sortOrder: 6, headCount: 10 },
  { id: 'd-prod', code: 'PRD', name: 'Production', isRevenueCenter: false, sortOrder: 7, headCount: 60 },
];

// ============================================================
//  Chart of Accounts
// ============================================================

export const mockCoA: ChartOfAccount[] = [
  { id: 'a1', code: '4000', name: 'Pendapatan Usaha', accountType: 'revenue', level: 1, isActive: true },
  { id: 'a2', code: '4100', name: 'Penjualan Produk A', accountType: 'revenue', parentId: 'a1', level: 2, isActive: true },
  { id: 'a3', code: '4200', name: 'Penjualan Produk B', accountType: 'revenue', parentId: 'a1', level: 2, isActive: true },
  { id: 'a4', code: '4300', name: 'Pendapatan Jasa', accountType: 'revenue', parentId: 'a1', level: 2, isActive: true },
  { id: 'a5', code: '5000', name: 'Harga Pokok Penjualan', accountType: 'expense', level: 1, isActive: true },
  { id: 'a6', code: '5100', name: 'Bahan Baku', accountType: 'expense', parentId: 'a5', level: 2, isActive: true },
  { id: 'a7', code: '5200', name: 'Tenaga Kerja Langsung', accountType: 'expense', parentId: 'a5', level: 2, isActive: true },
  { id: 'a8', code: '5300', name: 'Overhead Produksi', accountType: 'expense', parentId: 'a5', level: 2, isActive: true },
  { id: 'a9', code: '6000', name: 'Beban Operasional', accountType: 'expense', level: 1, isActive: true },
  { id: 'a10', code: '6100', name: 'Gaji & Tunjangan', accountType: 'expense', parentId: 'a9', level: 2, isActive: true },
  { id: 'a11', code: '6200', name: 'Beban Marketing', accountType: 'expense', parentId: 'a9', level: 2, isActive: true },
  { id: 'a12', code: '6300', name: 'Beban Administrasi & Umum', accountType: 'expense', parentId: 'a9', level: 2, isActive: true },
  { id: 'a13', code: '6400', name: 'Beban Perjalanan Dinas', accountType: 'expense', parentId: 'a9', level: 2, isActive: true },
  { id: 'a14', code: '6500', name: 'Beban Sewa', accountType: 'expense', parentId: 'a9', level: 2, isActive: true },
  { id: 'a15', code: '6600', name: 'Beban Utilitas', accountType: 'expense', parentId: 'a9', level: 2, isActive: true },
  { id: 'a16', code: '6700', name: 'Beban Depresiasi', accountType: 'expense', parentId: 'a9', level: 2, isActive: true },
];

// ============================================================
//  RKAP Cycles
// ============================================================

export const mockCycles: RkapCycle[] = [
  {
    id: 'c-2027',
    fiscalYear: 2027,
    periodType: 'monthly',
    status: 'draft',
    macroAssumptions: {
      inflationRate: 3.5,
      exchangeRateUsdIdr: 15800,
      biInterestRate: 5.75,
      industryGrowthRate: 5.2,
      commodityPrices: { 'CPO': 12500, 'Rubber': 8200 },
      taxRate: 22,
      beginningCash: 5000000000,
      beginningCashOption: 'manual',
      newLoanAmount: 0,
      loanInterestRate: 10,
      loanRepaymentAnnual: 0,
      dividendsPaid: 0,
    },
    versions: [
      { id: 'v1', version: 1, createdAt: '2026-05-20T10:00:00Z', createdBy: 'Rina Hartati', changeNote: 'Initial draft' },
    ],
    createdBy: 'u3',
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-22T14:00:00Z',
  },
  {
    id: 'c-2026',
    fiscalYear: 2026,
    periodType: 'monthly',
    status: 'approved',
    macroAssumptions: {
      inflationRate: 3.2,
      exchangeRateUsdIdr: 15500,
      biInterestRate: 5.5,
      industryGrowthRate: 5.0,
      commodityPrices: { 'CPO': 11800, 'Rubber': 7900 },
      taxRate: 22,
      beginningCash: 5000000000,
      beginningCashOption: 'manual',
      newLoanAmount: 0,
      loanInterestRate: 10,
      loanRepaymentAnnual: 0,
      dividendsPaid: 0,
    },
    versions: [
      { id: 'v1a', version: 1, createdAt: '2025-09-01T10:00:00Z', createdBy: 'Rina Hartati', changeNote: 'Initial draft' },
      { id: 'v2a', version: 2, createdAt: '2025-10-15T10:00:00Z', createdBy: 'Rina Hartati', changeNote: 'Revised after CFO review' },
      { id: 'v3a', version: 3, createdAt: '2025-11-01T10:00:00Z', createdBy: 'Diana Wijaya', changeNote: 'Final approved version' },
    ],
    createdBy: 'u3',
    createdAt: '2025-09-01T10:00:00Z',
    updatedAt: '2025-11-01T14:00:00Z',
  },
  {
    id: 'c-2025',
    fiscalYear: 2025,
    periodType: 'monthly',
    status: 'locked',
    macroAssumptions: {
      inflationRate: 3.0,
      exchangeRateUsdIdr: 15200,
      biInterestRate: 5.25,
      industryGrowthRate: 4.8,
      commodityPrices: { 'CPO': 11200, 'Rubber': 7500 },
      taxRate: 22,
      beginningCash: 5000000000,
      beginningCashOption: 'manual',
      newLoanAmount: 0,
      loanInterestRate: 10,
      loanRepaymentAnnual: 0,
      dividendsPaid: 0,
    },
    versions: [
      { id: 'v1b', version: 1, createdAt: '2024-09-01T10:00:00Z', createdBy: 'Rina Hartati', changeNote: 'Initial' },
    ],
    createdBy: 'u3',
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-12-01T14:00:00Z',
    lockedAt: '2024-12-01T14:00:00Z',
  },
];

// ============================================================
//  Revenue Budget (Modul 2)
// ============================================================

const revenueBase = [8200, 7800, 9100, 8900, 9500, 10200, 10800, 11200, 10500, 9800, 10100, 12500];

export const mockRevenue: RevenueLineItem[] = [
  {
    id: 'r1', cycleId: 'c-2027', departmentId: 'd-sales', accountId: 'a2',
    productName: 'Produk A — Premium', segment: 'Enterprise', channel: 'Direct Sales',
    monthlyTargets: mv(revenueBase.map(v => v * 1_000_000)),
    assumptions: { volume: 1200, pricePerUnit: 8_500_000, discountRate: 5 },
    previousYear: mv(revenueBase.map(v => Math.round(v * 0.92 * 1_000_000))),
  },
  {
    id: 'r2', cycleId: 'c-2027', departmentId: 'd-sales', accountId: 'a3',
    productName: 'Produk B — Standard', segment: 'SME', channel: 'Partner/Reseller',
    monthlyTargets: mv(revenueBase.map(v => Math.round(v * 0.65 * 1_000_000))),
    assumptions: { volume: 3500, pricePerUnit: 2_200_000, discountRate: 8 },
    previousYear: mv(revenueBase.map(v => Math.round(v * 0.58 * 1_000_000))),
  },
  {
    id: 'r3', cycleId: 'c-2027', departmentId: 'd-sales', accountId: 'a4',
    productName: 'Jasa Konsultasi', segment: 'Enterprise', channel: 'Direct Sales',
    monthlyTargets: mv(revenueBase.map(v => Math.round(v * 0.25 * 1_000_000))),
    assumptions: { volume: 200, pricePerUnit: 12_000_000, discountRate: 0 },
    previousYear: mv(revenueBase.map(v => Math.round(v * 0.22 * 1_000_000))),
  },
  {
    id: 'r4', cycleId: 'c-2027', departmentId: 'd-sales', accountId: 'a2',
    productName: 'Produk A — Basic', segment: 'Retail', channel: 'E-Commerce',
    monthlyTargets: mv(revenueBase.map(v => Math.round(v * 0.35 * 1_000_000))),
    assumptions: { volume: 5000, pricePerUnit: 850_000, discountRate: 12 },
    previousYear: mv(revenueBase.map(v => Math.round(v * 0.30 * 1_000_000))),
  },
];

// ============================================================
//  Cost Budget (Modul 3)
// ============================================================

const costBase = [2100, 2050, 2200, 2150, 2300, 2400, 2500, 2550, 2450, 2350, 2400, 2800];

export const mockCosts: CostLineItem[] = [
  { id: 'co1', cycleId: 'c-2027', departmentId: 'd-ops', accountId: 'a6', accountCode: '5100', accountName: 'Bahan Baku', category: 'variable', monthlyAmounts: scale(costBase, 1_000_000), notes: 'Linked to production volume' },
  { id: 'co2', cycleId: 'c-2027', departmentId: 'd-ops', accountId: 'a7', accountCode: '5200', accountName: 'Tenaga Kerja Langsung', category: 'semi_variable', monthlyAmounts: scale(costBase, 450_000), notes: 'Base + overtime' },
  { id: 'co3', cycleId: 'c-2027', departmentId: 'd-ops', accountId: 'a8', accountCode: '5300', accountName: 'Overhead Produksi', category: 'fixed', monthlyAmounts: mv(new Array(12).fill(850_000_000)) },
  { id: 'co4', cycleId: 'c-2027', departmentId: 'd-sales', accountId: 'a11', accountCode: '6200', accountName: 'Beban Marketing & Promosi', category: 'variable', monthlyAmounts: scale(costBase, 280_000), notes: '% of revenue' },
  { id: 'co5', cycleId: 'c-2027', departmentId: 'd-hr', accountId: 'a10', accountCode: '6100', accountName: 'Gaji & Tunjangan Karyawan', category: 'fixed', monthlyAmounts: mv(new Array(12).fill(2_800_000_000)) },
  { id: 'co6', cycleId: 'c-2027', departmentId: 'd-fin', accountId: 'a12', accountCode: '6300', accountName: 'Beban Administrasi & Umum', category: 'fixed', monthlyAmounts: mv(new Array(12).fill(450_000_000)) },
  { id: 'co7', cycleId: 'c-2027', departmentId: 'd-it', accountId: 'a15', accountCode: '6600', accountName: 'Beban Utilitas & Infrastruktur IT', category: 'semi_variable', monthlyAmounts: mv(new Array(12).fill(320_000_000)) },
  { id: 'co8', cycleId: 'c-2027', departmentId: 'd-sales', accountId: 'a13', accountCode: '6400', accountName: 'Beban Perjalanan Dinas', category: 'variable', monthlyAmounts: scale([180,160,200,190,210,220,250,230,200,195,185,280], 1_000_000) },
];

export const mockPersonnelCosts: PersonnelCost[] = [
  { id: 'pc1', cycleId: 'c-2027', departmentId: 'd-ops', position: 'Operator Produksi', headcount: 35, monthlySalary: 5_500_000, allowances: 1_500_000, bpjs: 550_000, bonus: 5_500_000, totalAnnual: 35 * (5_500_000 + 1_500_000 + 550_000) * 12 + 35 * 5_500_000, costCategory: 'cogs' },
  { id: 'pc2', cycleId: 'c-2027', departmentId: 'd-ops', position: 'Supervisor Produksi', headcount: 5, monthlySalary: 12_000_000, allowances: 3_000_000, bpjs: 1_200_000, bonus: 12_000_000, totalAnnual: 5 * (12_000_000 + 3_000_000 + 1_200_000) * 12 + 5 * 12_000_000, costCategory: 'cogs' },
  { id: 'pc3', cycleId: 'c-2027', departmentId: 'd-sales', position: 'Sales Executive', headcount: 15, monthlySalary: 8_000_000, allowances: 2_500_000, bpjs: 800_000, bonus: 16_000_000, totalAnnual: 15 * (8_000_000 + 2_500_000 + 800_000) * 12 + 15 * 16_000_000, costCategory: 'opex' },
  { id: 'pc4', cycleId: 'c-2027', departmentId: 'd-sales', position: 'Marketing Manager', headcount: 3, monthlySalary: 18_000_000, allowances: 5_000_000, bpjs: 1_800_000, bonus: 18_000_000, totalAnnual: 3 * (18_000_000 + 5_000_000 + 1_800_000) * 12 + 3 * 18_000_000, costCategory: 'opex' },
  { id: 'pc5', cycleId: 'c-2027', departmentId: 'd-fin', position: 'Accounting Staff', headcount: 6, monthlySalary: 8_500_000, allowances: 2_000_000, bpjs: 850_000, bonus: 8_500_000, totalAnnual: 6 * (8_500_000 + 2_000_000 + 850_000) * 12 + 6 * 8_500_000, costCategory: 'opex' },
  { id: 'pc6', cycleId: 'c-2027', departmentId: 'd-it', position: 'Software Engineer', headcount: 6, monthlySalary: 15_000_000, allowances: 3_000_000, bpjs: 1_500_000, bonus: 15_000_000, totalAnnual: 6 * (15_000_000 + 3_000_000 + 1_500_000) * 12 + 6 * 15_000_000, costCategory: 'opex' },
  { id: 'pc7', cycleId: 'c-2027', departmentId: 'd-hr', position: 'HR Staff', headcount: 5, monthlySalary: 7_500_000, allowances: 1_800_000, bpjs: 750_000, bonus: 7_500_000, totalAnnual: 5 * (7_500_000 + 1_800_000 + 750_000) * 12 + 5 * 7_500_000, costCategory: 'opex' },
];

// ============================================================
//  P&L Snapshot (Modul 5)
// ============================================================

const grossRev = mv(revenueBase.map(v => Math.round(v * 2.25 * 1_000_000)));
const cogs = mv(revenueBase.map(v => Math.round(v * 1.35 * 1_000_000)));
const grossProfit = subtractMv(grossRev, cogs);
const opex = mv(new Array(12).fill(4_420_000_000));
const ebitda = subtractMv(grossProfit, opex);
const depreciation = mv(new Array(12).fill(380_000_000));
const ebit = subtractMv(ebitda, depreciation);
const interest = mv(new Array(12).fill(125_000_000));
const ebt = subtractMv(ebit, interest);
const tax = mv(Object.values(ebt).map(v => Math.round(Math.max(0, v) * 0.22)));
const netInc = subtractMv(ebt, tax);

export const mockPnl: PnlSnapshot = {
  id: 'pnl-1', cycleId: 'c-2027', version: 1,
  summary: {
    grossRevenue: grossRev,
    cogs,
    grossProfit,
    operatingExpenses: opex,
    ebitda,
    depreciation,
    ebit,
    interestExpense: interest,
    ebt,
    incomeTax: tax,
    netIncome: netInc,
  },
  byDepartment: {},
  calculatedAt: '2026-05-22T14:00:00Z',
};

// ============================================================
//  Cash Flow (Modul 6)
// ============================================================

const cfDepAdj = depreciation;
const arChange = mv(revenueBase.map(v => Math.round(v * -0.08 * 1_000_000)));
const invChange = mv(revenueBase.map(v => Math.round(v * -0.05 * 1_000_000)));
const apChange = mv(revenueBase.map(v => Math.round(v * 0.06 * 1_000_000)));
const otherAdj = mv(new Array(12).fill(50_000_000));
const totalOp = sumMv(netInc, cfDepAdj, arChange, invChange, apChange, otherAdj);

const capexMv = mv([-800_000_000, -200_000_000, -350_000_000, -150_000_000, -500_000_000, -200_000_000, -300_000_000, -150_000_000, -250_000_000, -200_000_000, -100_000_000, -400_000_000]);
const disposal = mv([0, 0, 50_000_000, 0, 0, 0, 0, 100_000_000, 0, 0, 0, 0]);
const investments = mv(new Array(12).fill(0));
const totalInv = sumMv(capexMv, disposal, investments);

const loanProceeds = mv([5_000_000_000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const loanRepay = mv(new Array(12).fill(-420_000_000));
const equityIss = mv(new Array(12).fill(0));
const dividends = mv([0, 0, 0, -2_000_000_000, 0, 0, 0, 0, 0, 0, 0, 0]);
const totalFin = sumMv(loanProceeds, loanRepay, equityIss, dividends);

const netCF = sumMv(totalOp, totalInv, totalFin);
const openingCashArr: number[] = [15_000_000_000];
for (let i = 1; i < 12; i++) openingCashArr.push(openingCashArr[i - 1] + Object.values(netCF)[i - 1]);
const openingCash = mv(openingCashArr);
const closingCash = mv(openingCashArr.map((v, i) => v + Object.values(netCF)[i]));

export const mockCashFlow: CashFlowProjection = {
  id: 'cf-1', cycleId: 'c-2027', version: 1,
  operatingActivities: {
    netIncome: netInc, depreciationAdj: cfDepAdj, receivablesChange: arChange,
    inventoryChange: invChange, payablesChange: apChange, otherAdjustments: otherAdj,
    totalOperating: totalOp,
  },
  investingActivities: { capex: capexMv, assetDisposal: disposal, investments, totalInvesting: totalInv },
  financingActivities: { loanProceeds, loanRepayments: loanRepay, equityIssuance: equityIss, dividendsPaid: dividends, totalFinancing: totalFin },
  netCashFlow: netCF, openingCash, closingCash,
  wcAssumptions: { dso: 45, dio: 30, dpo: 35 },
  calculatedAt: '2026-05-22T14:00:00Z',
};

// ============================================================
//  Balance Sheet (Modul 7)
// ============================================================

const cashBs = closingCash;
const arBs = mv(Object.values(grossRev).map(v => Math.round(v * 45 / 30)));
const invBs = mv(Object.values(cogs).map(v => Math.round(v * 30 / 30)));
const prepaid = mv(new Array(12).fill(250_000_000));
const totalCA = sumMv(cashBs, arBs, invBs, prepaid);

const fixedAssets = mv(new Array(12).fill(25_000_000_000));
const accumDepr = mv(Object.values(depreciation).map((_, i) => (i + 1) * 380_000_000 + 5_000_000_000));
const netFA = subtractMv(fixedAssets, accumDepr);
const ltInvest = mv(new Array(12).fill(3_000_000_000));
const otherAssets = mv(new Array(12).fill(500_000_000));
const totalNCA = sumMv(netFA, ltInvest, otherAssets);
const totalAssets = sumMv(totalCA, totalNCA);

const apBs = mv(Object.values(cogs).map(v => Math.round(v * 35 / 30)));
const taxPayable = mv(Object.values(tax).map(v => Math.round(v * 0.5)));
const accrued = mv(new Array(12).fill(800_000_000));
const stDebt = mv(new Array(12).fill(2_000_000_000));
const totalCL = sumMv(apBs, taxPayable, accrued, stDebt);

const ltDebt = mv([10_000_000_000, 9_580_000_000, 9_160_000_000, 8_740_000_000, 8_320_000_000, 7_900_000_000, 7_480_000_000, 7_060_000_000, 6_640_000_000, 6_220_000_000, 5_800_000_000, 5_380_000_000]);
const bonds = mv(new Array(12).fill(5_000_000_000));
const empBenefits = mv(new Array(12).fill(1_200_000_000));
const totalLTL = sumMv(ltDebt, bonds, empBenefits);
const totalLiab = sumMv(totalCL, totalLTL);

const shareCapital = mv(new Array(12).fill(10_000_000_000));
const retainedEarnings = mv(Object.values(netInc).reduce((acc: number[], v, i) => {
  acc.push((acc[i - 1] ?? 8_000_000_000) + v);
  return acc;
}, [] as number[]));
const reserves = mv(new Array(12).fill(1_500_000_000));
const totalEq = sumMv(shareCapital, retainedEarnings, reserves);
const totalLE = sumMv(totalLiab, totalEq);
const discrepancyMv = subtractMv(totalAssets, totalLE);

export const mockBalanceSheet: BalanceSheetSnapshot = {
  id: 'bs-1', cycleId: 'c-2027', version: 1,
  currentAssets: { cashAndEquivalents: cashBs, accountsReceivable: arBs, inventory: invBs, prepaidExpenses: prepaid, totalCurrentAssets: totalCA },
  nonCurrentAssets: { fixedAssets, accumulatedDepreciation: accumDepr, netFixedAssets: netFA, longTermInvestments: ltInvest, otherAssets, totalNonCurrentAssets: totalNCA },
  totalAssets,
  currentLiabilities: { accountsPayable: apBs, taxPayable, accruedExpenses: accrued, shortTermDebt: stDebt, totalCurrentLiabilities: totalCL },
  longTermLiabilities: { longTermDebt: ltDebt, bonds, employeeBenefits: empBenefits, totalLongTermLiabilities: totalLTL },
  totalLiabilities: totalLiab,
  equity: { shareCapital, retainedEarnings, reserves, totalEquity: totalEq },
  totalLiabilitiesAndEquity: totalLE,
  isBalanced: Object.values(discrepancyMv).every(v => Math.abs(v) < 1000),
  discrepancy: discrepancyMv,
  financialRatios: {
    currentRatio: mv(Object.values(totalCA).map((v, i) => parseFloat((v / Object.values(totalCL)[i]).toFixed(2)))),
    debtToEquity: mv(Object.values(totalLiab).map((v, i) => parseFloat((v / Object.values(totalEq)[i]).toFixed(2)))),
    roe: mv(Object.values(netInc).map((v, i) => parseFloat(((v * 12) / Object.values(totalEq)[i] * 100).toFixed(1)))),
    roa: mv(Object.values(netInc).map((v, i) => parseFloat(((v * 12) / Object.values(totalAssets)[i] * 100).toFixed(1)))),
  },
  calculatedAt: '2026-05-22T14:00:00Z',
};

// ============================================================
//  Approval Workflow (Modul 9)
// ============================================================

export const mockWorkflow: ApprovalWorkflow = {
  id: 'wf-1', cycleId: 'c-2027',
  stages: [
    {
      id: 'stg1', workflowId: 'wf-1', stageName: 'Submit oleh Finance Manager',
      approverRole: 'finance_manager', approverUserId: 'u3', approverName: 'Rina Hartati',
      status: 'approved', decidedAt: '2026-05-21T10:00:00Z',
      comments: [
        { id: 'cmt1', stageId: 'stg1', userId: 'u3', userName: 'Rina Hartati', userRole: 'finance_manager', content: 'RKAP 2027 telah dikonsolidasikan dari seluruh departemen. Siap untuk review.', createdAt: '2026-05-21T10:00:00Z' },
      ],
      sortOrder: 1,
    },
    {
      id: 'stg2', workflowId: 'wf-1', stageName: 'Review oleh CFO',
      approverRole: 'cfo', approverUserId: 'u2', approverName: 'Diana Wijaya',
      status: 'pending', comments: [],
      deadline: '2026-05-28T17:00:00Z',
      sortOrder: 2,
    },
    {
      id: 'stg3', workflowId: 'wf-1', stageName: 'Approval Final Direksi',
      approverRole: 'cfo', approverUserId: 'u2', approverName: 'Diana Wijaya',
      status: 'pending', comments: [],
      deadline: '2026-06-05T17:00:00Z',
      sortOrder: 3,
    },
  ],
  currentStageIndex: 1,
  status: 'in_progress',
  submittedAt: '2026-05-21T10:00:00Z',
};

// ============================================================
//  Notifications
// ============================================================

export const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'u3', type: 'approval', title: 'Menunggu Review CFO', message: 'RKAP 2027 telah disubmit dan menunggu review dari CFO Diana Wijaya.', isRead: false, link: '/cycles/c-2027/workflow', createdAt: '2026-05-21T10:05:00Z' },
  { id: 'n2', userId: 'u3', type: 'deadline', title: 'Deadline Submission', message: 'Deadline pengisian anggaran departemen Operations: 25 Mei 2026', isRead: false, link: '/cycles/c-2027/costs', createdAt: '2026-05-20T08:00:00Z' },
  { id: 'n3', userId: 'u3', type: 'cycle', title: 'Siklus RKAP 2027 Dibuat', message: 'Siklus RKAP untuk tahun anggaran 2027 telah berhasil dibuat.', isRead: true, link: '/cycles/c-2027', createdAt: '2026-05-20T10:00:00Z' },
  { id: 'n4', userId: 'u3', type: 'revision', title: 'Revisi Departemen Sales', message: 'Departemen Sales telah merevisi target revenue Q3 (+8.5%).', isRead: true, link: '/cycles/c-2027/revenue', createdAt: '2026-05-19T14:00:00Z' },
  { id: 'n5', userId: 'u3', type: 'system', title: 'Kalkulasi Selesai', message: 'Proyeksi P&L, Cash Flow, dan Balance Sheet telah berhasil di-generate.', isRead: true, link: '/cycles/c-2027/pnl', createdAt: '2026-05-22T14:05:00Z' },
];

// ============================================================
//  Audit Logs
// ============================================================

export const mockAuditLogs: AuditLog[] = [
  { id: 'al1', userId: 'u3', userName: 'Rina Hartati', entityType: 'RkapCycle', entityId: 'c-2027', action: 'create', details: 'Membuat siklus RKAP tahun anggaran 2027', ipAddress: '192.168.1.100', createdAt: '2026-05-20T10:00:00Z' },
  { id: 'al2', userId: 'u3', userName: 'Rina Hartati', entityType: 'MacroAssumptions', entityId: 'c-2027', action: 'update', details: 'Mengubah inflasi dari 3.2% menjadi 3.5%', ipAddress: '192.168.1.100', createdAt: '2026-05-20T10:15:00Z' },
  { id: 'al3', userId: 'u5', userName: 'Siti Rahayu', entityType: 'RevenueBudget', entityId: 'r1', action: 'update', details: 'Mengubah target revenue Produk A bulan Juli', ipAddress: '192.168.1.105', createdAt: '2026-05-20T14:00:00Z' },
  { id: 'al4', userId: 'u7', userName: 'Dewi Lestari', entityType: 'CostBudget', entityId: 'co5', action: 'update', details: 'Revisi gaji & tunjangan departemen HR', ipAddress: '192.168.1.110', createdAt: '2026-05-21T09:00:00Z' },
  { id: 'al5', userId: 'u3', userName: 'Rina Hartati', entityType: 'ApprovalWorkflow', entityId: 'wf-1', action: 'submit', details: 'Submit RKAP 2027 untuk review CFO', ipAddress: '192.168.1.100', createdAt: '2026-05-21T10:00:00Z' },
  { id: 'al6', userId: 'u3', userName: 'Rina Hartati', entityType: 'PnlSnapshot', entityId: 'pnl-1', action: 'create', details: 'Generate proyeksi P&L versi 1', ipAddress: '192.168.1.100', createdAt: '2026-05-22T14:00:00Z' },
  { id: 'al7', userId: 'u4', userName: 'Agus Pratama', entityType: 'CostBudget', entityId: 'co1', action: 'update', details: 'Mengubah anggaran bahan baku bulan Agustus', ipAddress: '192.168.1.104', createdAt: '2026-05-22T15:30:00Z' },
  { id: 'al8', userId: 'u3', userName: 'Rina Hartati', entityType: 'CashFlowProjection', entityId: 'cf-1', action: 'create', details: 'Generate proyeksi Cash Flow versi 1', ipAddress: '192.168.1.100', createdAt: '2026-05-22T14:02:00Z' },
];

export const mockCapEx: CapExItem[] = [
  {
    id: 'cx1',
    cycleId: 'c-2027',
    departmentId: 'd-ops',
    assetName: 'Mesin Produksi Otomatis',
    category: 'Mesin',
    qty: 2,
    costPerUnit: 1250000000,
    totalCost: 2500000000,
    usefulLife: 8,
    depreciationMethod: 'straight_line',
    procurementMonth: 'mar',
    notes: 'Peningkatan kapasitas produksi pabrik utama'
  },
  {
    id: 'cx2',
    cycleId: 'c-2027',
    departmentId: 'd-it',
    assetName: 'Upgrade Server & Network Infrastructure',
    category: 'Peralatan IT',
    qty: 1,
    costPerUnit: 450000000,
    totalCost: 450000000,
    usefulLife: 4,
    depreciationMethod: 'straight_line',
    procurementMonth: 'may',
    notes: 'Mendukung digitalisasi sistem ERP'
  },
  {
    id: 'cx3',
    cycleId: 'c-2027',
    departmentId: 'd-sales',
    assetName: 'Mobil Operasional Sales',
    category: 'Kendaraan',
    qty: 3,
    costPerUnit: 280000000,
    totalCost: 840000000,
    usefulLife: 5,
    depreciationMethod: 'straight_line',
    procurementMonth: 'jul',
    notes: 'Mobil dinas sales lapangan'
  }
];
