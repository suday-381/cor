import { create } from 'zustand';
import type {
  User, UserRole, RkapCycle, CycleStatus, PeriodType, MacroAssumptions,
  RevenueLineItem, CostLineItem, PersonnelCost, PnlSnapshot, PnlSummary,
  CashFlowProjection, BalanceSheetSnapshot, ApprovalWorkflow, Notification,
  AuditLog, MonthlyValues, WorkingCapitalAssumptions, CapExItem, ChartOfAccount, Department,
  DisplayUnit
} from '@/types';
import { api } from '@/utils/api';
import {
  mockUsers, mockCycles, mockDepartments, mockCoA, mockRevenue,
  mockCosts, mockPersonnelCosts, mockPnl, mockCashFlow, mockBalanceSheet,
  mockWorkflow, mockNotifications, mockAuditLogs, mockCapEx
} from '@/data/mockData';

interface AppState {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (email: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;

  // Master Data
  departments: Department[];
  coa: ChartOfAccount[];
  addCoAItem: (item: Omit<ChartOfAccount, 'id'>) => Promise<void>;
  updateCoAItem: (id: string, updates: Partial<ChartOfAccount>) => Promise<void>;
  addDepartment: (dept: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;

  // Cycles
  cycles: RkapCycle[];
  selectedCycleId: string;
  selectCycle: (id: string) => void;
  addCycle: (year: number, periodType: PeriodType, macro: MacroAssumptions) => Promise<void>;
  updateCycleStatus: (id: string, status: CycleStatus) => Promise<void>;
  updateMacroAssumptions: (id: string, macro: Partial<MacroAssumptions>) => Promise<void>;
  copyCycle: (sourceId: string, targetYear: number) => Promise<void>;

  // Revenue
  revenueItems: RevenueLineItem[];
  addRevenueItem: (item: Omit<RevenueLineItem, 'id'>) => Promise<void>;
  updateRevenueItem: (id: string, updates: Partial<RevenueLineItem>) => Promise<void>;
  deleteRevenueItem: (id: string) => Promise<void>;

  // Cost
  costItems: CostLineItem[];
  addCostItem: (item: Omit<CostLineItem, 'id'>) => Promise<void>;
  updateCostItem: (id: string, updates: Partial<CostLineItem>) => Promise<void>;
  deleteCostItem: (id: string) => Promise<void>;

  // Personnel
  personnelItems: PersonnelCost[];
  addPersonnelItem: (item: Omit<PersonnelCost, 'id'>) => Promise<void>;
  updatePersonnelItem: (id: string, updates: Partial<PersonnelCost>) => Promise<void>;
  deletePersonnelItem: (id: string) => Promise<void>;

  // CapEx
  capexItems: CapExItem[];
  addCapExItem: (item: Omit<CapExItem, 'id'>) => Promise<void>;
  updateCapExItem: (id: string, updates: Partial<CapExItem>) => Promise<void>;
  deleteCapExItem: (id: string) => Promise<void>;

  // Calculations & Projections
  pnlSnapshot: PnlSnapshot | null;
  cashFlowSnapshot: CashFlowProjection | null;
  balanceSheetSnapshot: BalanceSheetSnapshot | null;
  recalculateAll: () => Promise<void>;
  updateWcAssumptions: (wc: WorkingCapitalAssumptions) => Promise<void>;

  // Workflow
  workflow: ApprovalWorkflow | null;
  submitWorkflow: (departmentId?: string) => Promise<void>;
  approveWorkflowStage: (comment: string, departmentId?: string) => Promise<void>;
  rejectWorkflowStage: (comment: string, departmentId?: string) => Promise<void>;
  reviseWorkflow: (departmentId?: string) => Promise<void>;
  loadWorkflow: (cycleId: string, departmentId?: string) => Promise<void>;

  // Notifications
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string, entityType: string, entityId: string) => Promise<void>;

  // Data Loading Helpers
  loadInitialData: () => Promise<void>;
  loadCycleData: (cycleId: string) => Promise<void>;

  // Currency unit settings
  displayUnit: DisplayUnit;
  setDisplayUnit: (unit: DisplayUnit) => void;
}

const getStoredUser = (): User | null => {
  try {
    const val = localStorage.getItem('corplan_user');
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  // Currency unit settings
  displayUnit: 'normal',
  setDisplayUnit: (unit) => set({ displayUnit: unit }),

  // Auth
  currentUser: getStoredUser() || mockUsers.find(u => u.role === 'finance_manager') || mockUsers[0],
  users: mockUsers,
  login: async (email, role) => {
    try {
      const res = await api.post<{ access_token: string; user: User }>('/auth/login', { email });
      localStorage.setItem('corplan_token', res.access_token);
      localStorage.setItem('corplan_user', JSON.stringify(res.user));
      set({ currentUser: res.user });
      
      await get().loadInitialData();
      const cycles = get().cycles;
      if (cycles.length > 0) {
        const defaultCycleId = cycles[0].id;
        set({ selectedCycleId: defaultCycleId });
        await get().loadCycleData(defaultCycleId);
      }
      
      await get().addAuditLog('login', `User ${res.user.name} logged in as ${role}`, 'User', res.user.id);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      // Local fallback for quick test if API is down
      const user = mockUsers.find(u => u.email === email && u.role === role);
      if (user) {
        localStorage.setItem('corplan_user', JSON.stringify(user));
        set({ currentUser: user });
        return true;
      }
      return false;
    }
  },
  logout: () => {
    const user = get().currentUser;
    if (user) {
      get().addAuditLog('logout', `User ${user.name} logged out`, 'User', user.id);
    }
    localStorage.removeItem('corplan_token');
    localStorage.removeItem('corplan_user');
    set({ currentUser: null });
  },
  updateUser: async (id, updates) => {
    try {
      const updated = await api.patch<User>(`/users/${id}`, updates);
      set(state => ({
        users: state.users.map(u => u.id === id ? updated : u),
        currentUser: state.currentUser && state.currentUser.id === id ? updated : state.currentUser
      }));
    } catch (err) {
      console.error(err);
      // Fallback
      set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
        currentUser: state.currentUser && state.currentUser.id === id ? { ...state.currentUser, ...updates } : state.currentUser
      }));
    }
  },
  addUser: async (user) => {
    try {
      const newUser = await api.post<User>('/users', user);
      set(state => ({ users: [...state.users, newUser] }));
    } catch (err) {
      console.error(err);
      // Fallback
      const newId = `u${get().users.length + 1}`;
      const newUser: User = { ...user, id: newId, createdAt: new Date().toISOString() };
      set(state => ({ users: [...state.users, newUser] }));
    }
  },

  // Master Data
  departments: mockDepartments,
  coa: mockCoA,
  addCoAItem: async (item) => {
    try {
      // Backend handles CoA through MasterData or direct. Fallback for mock:
      set(state => {
        const newId = `a${state.coa.length + 1}`;
        return { coa: [...state.coa, { ...item, id: newId } as ChartOfAccount] };
      });
    } catch (err) {
      console.error(err);
    }
  },
  updateCoAItem: async (id, updates) => {
    set(state => ({
      coa: state.coa.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  },
  addDepartment: async (dept) => {
    set(state => {
      const newId = `d-${dept.code.toLowerCase()}`;
      return { departments: [...state.departments, { ...dept, id: newId } as Department] };
    });
  },
  updateDepartment: async (id, updates) => {
    set(state => ({
      departments: state.departments.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  },

  // Cycles
  cycles: mockCycles,
  selectedCycleId: 'c-2027',
  selectCycle: (id) => {
    set({ selectedCycleId: id });
    get().loadCycleData(id);
  },
  addCycle: async (year, periodType, macro) => {
    try {
      const newCycle = await api.post<RkapCycle>('/rkap-cycles', {
        fiscalYear: year,
        periodType,
        macroAssumptions: macro
      });
      set(state => ({
        cycles: [newCycle, ...state.cycles],
        selectedCycleId: newCycle.id
      }));
      await get().loadCycleData(newCycle.id);
    } catch (err) {
      console.error(err);
      // Fallback
      const newId = `c-${year}`;
      const newCycle: RkapCycle = {
        id: newId,
        fiscalYear: year,
        periodType,
        status: 'draft',
        macroAssumptions: macro,
        versions: [{ id: `v-${newId}-1`, version: 1, createdAt: new Date().toISOString(), createdBy: get().currentUser?.name || 'System', changeNote: 'Siklus dibuat' }],
        createdBy: get().currentUser?.id || 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set(state => ({
        cycles: [newCycle, ...state.cycles],
        selectedCycleId: newId
      }));
    }
  },
  updateCycleStatus: async (id, status) => {
    try {
      const updated = await api.patch<RkapCycle>(`/rkap-cycles/${id}/status`, { status });
      set(state => ({
        cycles: state.cycles.map(c => c.id === id ? updated : c)
      }));
    } catch (err) {
      console.error(err);
      set(state => ({
        cycles: state.cycles.map(c => c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c)
      }));
    }
  },
  updateMacroAssumptions: async (id, macro) => {
    try {
      const updated = await api.patch<RkapCycle>(`/rkap-cycles/${id}/macro`, macro);
      set(state => ({
        cycles: state.cycles.map(c => c.id === id ? updated : c)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
      set(state => ({
        cycles: state.cycles.map(c => c.id === id ? { ...c, macroAssumptions: { ...c.macroAssumptions, ...macro } } : c)
      }));
    }
  },
  copyCycle: async (sourceId, targetYear) => {
    try {
      const newCycle = await api.post<RkapCycle>(`/rkap-cycles/${sourceId}/copy`, { targetYear });
      set(state => ({
        cycles: [newCycle, ...state.cycles],
        selectedCycleId: newCycle.id
      }));
      await get().loadCycleData(newCycle.id);
    } catch (err) {
      console.error('Failed to copy cycle in backend:', err);
    }
  },

  // Revenue
  revenueItems: mockRevenue,
  addRevenueItem: async (item) => {
    try {
      const newItem = await api.post<RevenueLineItem>('/revenue', item);
      set(state => ({ revenueItems: [...state.revenueItems, newItem] }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },
  updateRevenueItem: async (id, updates) => {
    try {
      const updated = await api.patch<RevenueLineItem>(`/revenue/${id}`, updates);
      set(state => ({
        revenueItems: state.revenueItems.map(item => item.id === id ? updated : item)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },
  deleteRevenueItem: async (id) => {
    try {
      await api.delete(`/revenue/${id}`);
      set(state => ({
        revenueItems: state.revenueItems.filter(item => item.id !== id)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },

  // Cost
  costItems: mockCosts,
  addCostItem: async (item) => {
    try {
      const newItem = await api.post<CostLineItem>('/cost/line-items', item);
      set(state => ({ costItems: [...state.costItems, newItem] }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },
  updateCostItem: async (id, updates) => {
    try {
      const updated = await api.patch<CostLineItem>(`/cost/line-items/${id}`, updates);
      set(state => ({
        costItems: state.costItems.map(item => item.id === id ? updated : item)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },
  deleteCostItem: async (id) => {
    try {
      await api.delete(`/cost/line-items/${id}`);
      set(state => ({
        costItems: state.costItems.filter(item => item.id !== id)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },

  // Personnel
  personnelItems: mockPersonnelCosts,
  addPersonnelItem: async (item) => {
    try {
      const newItem = await api.post<PersonnelCost>('/cost/personnel', item);
      set(state => ({ personnelItems: [...state.personnelItems, newItem] }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },
  updatePersonnelItem: async (id, updates) => {
    try {
      const updated = await api.patch<PersonnelCost>(`/cost/personnel/${id}`, updates);
      set(state => ({
        personnelItems: state.personnelItems.map(item => item.id === id ? updated : item)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },
  deletePersonnelItem: async (id) => {
    try {
      await api.delete(`/cost/personnel/${id}`);
      set(state => ({
        personnelItems: state.personnelItems.filter(item => item.id !== id)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },

  // CapEx
  capexItems: mockCapEx,
  addCapExItem: async (item) => {
    try {
      const newItem = await api.post<CapExItem>('/capex', item);
      set(state => ({ capexItems: [...state.capexItems, newItem] }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },
  updateCapExItem: async (id, updates) => {
    try {
      const updated = await api.patch<CapExItem>(`/capex/${id}`, updates);
      set(state => ({
        capexItems: state.capexItems.map(item => item.id === id ? updated : item)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },
  deleteCapExItem: async (id) => {
    try {
      await api.delete(`/capex/${id}`);
      set(state => ({
        capexItems: state.capexItems.filter(item => item.id !== id)
      }));
      await get().recalculateAll();
    } catch (err) {
      console.error(err);
    }
  },

  // Calculations & Projections
  pnlSnapshot: mockPnl,
  cashFlowSnapshot: mockCashFlow,
  balanceSheetSnapshot: mockBalanceSheet,
  recalculateAll: async () => {
    try {
      const cycleId = get().selectedCycleId;
      if (!cycleId) return;

      const wc = get().cashFlowSnapshot?.wcAssumptions || { dso: 45, dio: 30, dpo: 35 };
      const res = await api.post<{
        pnl: PnlSnapshot;
        cashflow: CashFlowProjection;
        balancesheet: BalanceSheetSnapshot;
      }>('/projections/recalculate', { cycleId, wcAssumptions: wc });

      set({
        pnlSnapshot: res.pnl,
        cashFlowSnapshot: res.cashflow,
        balanceSheetSnapshot: res.balancesheet
      });
    } catch (err) {
      console.error('Failed to run recalculation:', err);
    }
  },
  updateWcAssumptions: async (wc) => {
    try {
      const cycleId = get().selectedCycleId;
      if (!cycleId) return;

      const res = await api.post<{
        pnl: PnlSnapshot;
        cashflow: CashFlowProjection;
        balancesheet: BalanceSheetSnapshot;
      }>('/projections/recalculate', { cycleId, wcAssumptions: wc });

      set({
        pnlSnapshot: res.pnl,
        cashFlowSnapshot: res.cashflow,
        balanceSheetSnapshot: res.balancesheet
      });
    } catch (err) {
      console.error('Failed to update working capital assumptions:', err);
    }
  },

  // Workflow
  workflow: mockWorkflow,
  submitWorkflow: async (departmentId) => {
    try {
      const cycleId = get().selectedCycleId;
      if (!cycleId) return;
      const deptId = departmentId || get().currentUser?.departmentId;
      const workflow = await api.post<ApprovalWorkflow>('/workflow/submit', { cycleId, departmentId: deptId });
      set({ workflow });
      set(state => ({
        cycles: state.cycles.map(c => c.id === cycleId ? { ...c, status: 'in_review' } : c)
      }));
    } catch (err) {
      console.error(err);
    }
  },
  approveWorkflowStage: async (comment, departmentId) => {
    try {
      const cycleId = get().selectedCycleId;
      if (!cycleId) return;
      const deptId = departmentId || get().currentUser?.departmentId;
      const workflow = await api.post<ApprovalWorkflow>('/workflow/approve', { cycleId, departmentId: deptId, comment });
      set({ workflow });
      
      const newStatus = workflow.status === 'approved' ? 'approved' : 'in_review';
      set(state => ({
        cycles: state.cycles.map(c => c.id === cycleId ? { ...c, status: newStatus as any } : c)
      }));
    } catch (err) {
      console.error(err);
    }
  },
  rejectWorkflowStage: async (comment, departmentId) => {
    try {
      const cycleId = get().selectedCycleId;
      if (!cycleId) return;
      const deptId = departmentId || get().currentUser?.departmentId;
      const workflow = await api.post<ApprovalWorkflow>('/workflow/reject', { cycleId, departmentId: deptId, comment });
      set({ workflow });
      set(state => ({
        cycles: state.cycles.map(c => c.id === cycleId ? { ...c, status: 'draft' } : c)
      }));
    } catch (err) {
      console.error(err);
    }
  },
  reviseWorkflow: async (departmentId) => {
    try {
      const cycleId = get().selectedCycleId;
      if (!cycleId) return;
      const deptId = departmentId || get().currentUser?.departmentId;
      const workflow = await api.post<ApprovalWorkflow>('/workflow/revise', { cycleId, departmentId: deptId });
      set({ workflow });
    } catch (err) {
      console.error(err);
    }
  },
  loadWorkflow: async (cycleId, departmentId) => {
    try {
      const workflow = await api.get<ApprovalWorkflow>('/workflow', { cycleId, departmentId });
      set({ workflow });
    } catch (err) {
      console.error(err);
    }
  },

  // Notifications
  notifications: mockNotifications,
  markNotificationAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      }));
    } catch (err) {
      console.error(err);
    }
  },
  markAllNotificationsAsRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true }))
      }));
    } catch (err) {
      console.error(err);
    }
  },

  // Audit Logs
  auditLogs: mockAuditLogs,
  addAuditLog: async (action, details, entityType, entityId) => {
    try {
      // Backend creates audit logs automatically on most mutations.
      // We can also log client-specific logs locally or trigger audit log service if exposed.
      const newLog: AuditLog = {
        id: `al-${Date.now()}`,
        userId: get().currentUser?.id || 'system',
        userName: get().currentUser?.name || 'System',
        entityType,
        entityId,
        action: action as any,
        details,
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString()
      };
      set(state => ({ auditLogs: [newLog, ...state.auditLogs] }));
    } catch (err) {
      console.error(err);
    }
  },

  // Data Loading Helpers
  loadInitialData: async () => {
    try {
      const [depts, coa, cycles, users, logs, notifs] = await Promise.all([
        api.get<Department[]>('/departments'),
        api.get<ChartOfAccount[]>('/coa'),
        api.get<RkapCycle[]>('/rkap-cycles'),
        api.get<User[]>('/users'),
        api.get<AuditLog[]>('/audit-logs'),
        api.get<Notification[]>('/notifications')
      ]);

      set({
        departments: depts,
        coa,
        cycles,
        users,
        auditLogs: logs,
        notifications: notifs
      });

      // Auto-select a valid cycle from the database if the current one is not in the list
      const currentSelected = get().selectedCycleId;
      if (cycles.length > 0) {
        const exists = cycles.some(c => c.id === currentSelected);
        if (!exists) {
          const preferredCycle = cycles.find(c => c.fiscalYear === 2027) || cycles[0];
          set({ selectedCycleId: preferredCycle.id });
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  },
  loadCycleData: async (cycleId) => {
    try {
      const departmentId = get().currentUser?.departmentId;
      const [revs, costs, personnel, capex, workflow] = await Promise.all([
        api.get<RevenueLineItem[]>('/revenue', { cycleId }),
        api.get<CostLineItem[]>('/cost/line-items', { cycleId }),
        api.get<PersonnelCost[]>('/cost/personnel', { cycleId }),
        api.get<CapExItem[]>('/capex', { cycleId }),
        api.get<ApprovalWorkflow>('/workflow', { cycleId, departmentId })
      ]);

      let pnl = null;
      let cashFlow = null;
      let balanceSheet = null;

      try { pnl = await api.get<PnlSnapshot>('/projections/pnl', { cycleId }); } catch {}
      try { cashFlow = await api.get<CashFlowProjection>('/projections/cashflow', { cycleId }); } catch {}
      try { balanceSheet = await api.get<BalanceSheetSnapshot>('/projections/balancesheet', { cycleId }); } catch {}

      set({
        revenueItems: revs,
        costItems: costs,
        personnelItems: personnel,
        capexItems: capex,
        workflow,
        pnlSnapshot: pnl,
        cashFlowSnapshot: cashFlow,
        balanceSheetSnapshot: balanceSheet
      });
    } catch (err) {
      console.error('Failed to load cycle data:', err);
    }
  }
}));
