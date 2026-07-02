/* ========== User & Auth Types ========== */

export type UserRole = 'super_admin' | 'cfo' | 'finance_manager' | 'dept_head' | 'staff_finance' | 'viewer' | 'csp_senior_manager' | 'gm_csp_finance' | 'gm' | 'budget_owner' | 'csp';

export type DocumentStatus = 'Draft' | 'In Review GM' | 'In Review CSP' | 'Approve' | 'Reject';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  departmentId?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  cfo: 'CFO / Direktur',
  finance_manager: 'Finance Manager',
  dept_head: 'Kepala Departemen',
  staff_finance: 'Staff Finance',
  viewer: 'Viewer',
  csp_senior_manager: 'CSP Senior Manager',
  gm_csp_finance: 'GM CSP & Finance',
  gm: 'General Manager Divisi',
  budget_owner: 'Budget Owner',
  csp: 'Corporate Strategic Planning',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: '#EF4444',
  cfo: '#6366F1',
  finance_manager: '#10B981',
  dept_head: '#F59E0B',
  staff_finance: '#3B82F6',
  viewer: '#6B7280',
  csp_senior_manager: '#EC4899',
  gm_csp_finance: '#8B5CF6',
  gm: '#10B981',
  budget_owner: '#F59E0B',
  csp: '#EC4899',
};

/* ========== RKAP Cycle Types (Modul 1) ========== */

export type CycleStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'locked';
export type PeriodType = 'annual' | 'quarterly' | 'monthly';

export interface MacroAssumptions {
  inflationRate: number;
  exchangeRateUsdIdr: number;
  biInterestRate: number;
  industryGrowthRate: number;
  commodityPrices: Record<string, number>;
  taxRate: number;
  beginningCash: number;
  beginningCashOption: 'manual' | 'previous_year';
  newLoanAmount: number;
  loanInterestRate: number;
  loanRepaymentAnnual: number;
  dividendsPaid: number;
  previousBalanceSheet?: Record<string, number>;
}

export interface CycleVersion {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  changeNote: string;
}

export interface RkapCycle {
  id: string;
  fiscalYear: number;
  periodType: PeriodType;
  status: CycleStatus;
  macroAssumptions: MacroAssumptions;
  versions: CycleVersion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  dueDate?: string;
}

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  published: 'Published',
  locked: 'Locked',
};

/* ========== Department Types ========== */

export interface Department {
  id: string;
  code: string;
  name: string;
  isRevenueCenter: boolean;
  parentId?: string;
  sortOrder: number;
  headCount?: number;
}

/* ========== Chart of Account Types ========== */

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  parentId?: string;
  level: number;
  isActive: boolean;
}

/* ========== Revenue Types (Modul 2) ========== */

export interface MonthlyValues {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export const MONTH_KEYS: (keyof MonthlyValues)[] = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
export const MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

export interface RevenueLineItem {
  id: string;
  cycleId: string;
  departmentId: string;
  accountId: string;
  productName: string;
  segment: string;
  channel: string;
  monthlyTargets: MonthlyValues;
  assumptions: {
    volume: number;
    pricePerUnit: number;
    discountRate: number;
  };
  previousYear?: MonthlyValues;
  customer?: string;
  project?: string;
  revenueStatus?: 'sustain' | 'scaling';
}

/* ========== Cost Types (Modul 3) ========== */

export type CostCategory = 'fixed' | 'variable' | 'semi_variable';

export interface CostLineItem {
  id: string;
  cycleId: string;
  departmentId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  category: CostCategory;
  monthlyAmounts: MonthlyValues;
  previousYear?: MonthlyValues;
  notes?: string;
}

export interface PersonnelCost {
  id: string;
  cycleId: string;
  departmentId: string;
  position: string;
  headcount: number;
  monthlySalary: number;
  allowances: number;
  bpjs: number;
  bonus: number;
  totalAnnual: number;
  costCategory: 'cogs' | 'opex';
}

/* ========== CapEx Types (Modul 4) ========== */

export interface CapExItem {
  id: string;
  cycleId: string;
  departmentId: string;
  assetName: string;
  category: string; // e.g. 'Kendaraan', 'Peralatan IT', 'Mesin', 'Gedung'
  qty: number;
  costPerUnit: number;
  totalCost: number;
  usefulLife: number; // in years
  depreciationMethod: 'straight_line' | 'double_declining';
  procurementMonth: keyof MonthlyValues;
  notes?: string;
}

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  fixed: 'Biaya Tetap',
  variable: 'Biaya Variabel',
  semi_variable: 'Biaya Semi-Variabel',
};

/* ========== P&L Types (Modul 5) ========== */

export interface PnlSummary {
  grossRevenue: MonthlyValues;
  cogs: MonthlyValues;
  grossProfit: MonthlyValues;
  operatingExpenses: MonthlyValues;
  ebitda: MonthlyValues;
  depreciation: MonthlyValues;
  ebit: MonthlyValues;
  interestExpense: MonthlyValues;
  ebt: MonthlyValues;
  incomeTax: MonthlyValues;
  netIncome: MonthlyValues;
}

export interface PnlSnapshot {
  id: string;
  cycleId: string;
  version: number;
  summary: PnlSummary;
  byDepartment: Record<string, PnlSummary>;
  calculatedAt: string;
}

/* ========== Cash Flow Types (Modul 6) ========== */

export interface WorkingCapitalAssumptions {
  dso: number; // Days Sales Outstanding
  dio: number; // Days Inventory Outstanding
  dpo: number; // Days Payable Outstanding
}

export interface CashFlowProjection {
  id: string;
  cycleId: string;
  version: number;
  operatingActivities: {
    netIncome: MonthlyValues;
    depreciationAdj: MonthlyValues;
    receivablesChange: MonthlyValues;
    inventoryChange: MonthlyValues;
    payablesChange: MonthlyValues;
    otherAdjustments: MonthlyValues;
    totalOperating: MonthlyValues;
  };
  investingActivities: {
    capex: MonthlyValues;
    assetDisposal: MonthlyValues;
    investments: MonthlyValues;
    totalInvesting: MonthlyValues;
  };
  financingActivities: {
    loanProceeds: MonthlyValues;
    loanRepayments: MonthlyValues;
    equityIssuance: MonthlyValues;
    dividendsPaid: MonthlyValues;
    totalFinancing: MonthlyValues;
  };
  netCashFlow: MonthlyValues;
  openingCash: MonthlyValues;
  closingCash: MonthlyValues;
  wcAssumptions: WorkingCapitalAssumptions;
  calculatedAt: string;
}

/* ========== Balance Sheet Types (Modul 7) ========== */

export interface BalanceSheetSnapshot {
  id: string;
  cycleId: string;
  version: number;
  currentAssets: {
    cashAndEquivalents: MonthlyValues;
    accountsReceivable: MonthlyValues;
    inventory: MonthlyValues;
    prepaidExpenses: MonthlyValues;
    totalCurrentAssets: MonthlyValues;
  };
  nonCurrentAssets: {
    fixedAssets: MonthlyValues;
    accumulatedDepreciation: MonthlyValues;
    netFixedAssets: MonthlyValues;
    longTermInvestments: MonthlyValues;
    otherAssets: MonthlyValues;
    totalNonCurrentAssets: MonthlyValues;
  };
  totalAssets: MonthlyValues;
  currentLiabilities: {
    accountsPayable: MonthlyValues;
    taxPayable: MonthlyValues;
    accruedExpenses: MonthlyValues;
    shortTermDebt: MonthlyValues;
    totalCurrentLiabilities: MonthlyValues;
  };
  longTermLiabilities: {
    longTermDebt: MonthlyValues;
    bonds: MonthlyValues;
    employeeBenefits: MonthlyValues;
    totalLongTermLiabilities: MonthlyValues;
  };
  totalLiabilities: MonthlyValues;
  equity: {
    shareCapital: MonthlyValues;
    retainedEarnings: MonthlyValues;
    reserves: MonthlyValues;
    totalEquity: MonthlyValues;
  };
  totalLiabilitiesAndEquity: MonthlyValues;
  isBalanced: boolean;
  discrepancy: MonthlyValues;
  financialRatios: {
    currentRatio: MonthlyValues;
    debtToEquity: MonthlyValues;
    roe: MonthlyValues;
    roa: MonthlyValues;
  };
  calculatedAt: string;
}

/* ========== Workflow Types (Modul 9) ========== */

export type ApprovalAction = 'submit' | 'approve' | 'reject' | 'revise' | 'escalate';
export type StageStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface ApprovalComment {
  id: string;
  stageId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}

export interface ApprovalStage {
  id: string;
  workflowId: string;
  stageName: string;
  approverRole: UserRole;
  approverUserId: string;
  approverName: string;
  status: StageStatus;
  comments: ApprovalComment[];
  deadline?: string;
  decidedAt?: string;
  sortOrder: number;
}

export interface ApprovalWorkflow {
  id: string;
  cycleId: string;
  stages: ApprovalStage[];
  currentStageIndex: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  submittedAt?: string;
  completedAt?: string;
  departmentId?: string;
  submissionName?: string;
  submissionVersion?: number;
}

/* ========== Notification Types ========== */

export type NotificationType = 'approval' | 'revision' | 'deadline' | 'system' | 'cycle';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

/* ========== Audit Log Types ========== */

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'submit' | 'export';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export type DisplayUnit = 'normal' | 'ribu' | 'juta' | 'milyar';

