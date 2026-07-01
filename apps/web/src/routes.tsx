import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CycleListPage } from '@/pages/rkap-cycle/CycleListPage';
import { RevenueBudgetPage } from '@/pages/revenue/RevenueBudgetPage';
import { CostBudgetPage } from '@/pages/cost/CostBudgetPage';
import { PersonnelCostPage } from '@/pages/cost/PersonnelCostPage';
import { PnlPage } from '@/pages/projections/PnlPage';
import { CashFlowPage } from '@/pages/projections/CashFlowPage';
import { BalanceSheetPage } from '@/pages/projections/BalanceSheetPage';
import { WorkflowPage } from '@/pages/workflow/WorkflowPage';
import { ExportPage } from '@/pages/reports/ExportPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { DepartmentPage } from '@/pages/admin/DepartmentPage';
import { CoaPage } from '@/pages/admin/CoaPage';
import { SystemSettingsPage } from '@/pages/admin/SystemSettingsPage';
import { CapExBudgetPage } from '@/pages/capex/CapExBudgetPage';
import { ScenarioPage } from '@/pages/scenario/ScenarioPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="cycles" element={<CycleListPage />} />
        <Route path="revenue" element={<RevenueBudgetPage />} />
        <Route path="costs" element={<CostBudgetPage />} />
        <Route path="costs/personnel" element={<PersonnelCostPage />} />
        <Route path="capex" element={<CapExBudgetPage />} />
        <Route path="pnl" element={<PnlPage />} />
        <Route path="cashflow" element={<CashFlowPage />} />
        <Route path="balance-sheet" element={<BalanceSheetPage />} />
        <Route path="scenario" element={<ScenarioPage />} />
        <Route path="workflow" element={<WorkflowPage />} />
        <Route path="export" element={<ExportPage />} />

        {/* Administration */}
        <Route path="admin/users" element={<UserManagementPage />} />
        <Route path="admin/departments" element={<DepartmentPage />} />
        <Route path="admin/coa" element={<CoaPage />} />
        <Route path="admin/audit" element={<SystemSettingsPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
