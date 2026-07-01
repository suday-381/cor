import React from 'react';
import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  CalendarOutlined,
  LineChartOutlined,
  DollarOutlined,
  PieChartOutlined,
  AccountBookOutlined,
  SolutionOutlined,
  ExportOutlined,
  UserOutlined,
  ClusterOutlined,
  BookOutlined,
  HistoryOutlined,
  BuildOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore(state => state.currentUser);

  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/cycles')) return 'cycles';
    if (path.startsWith('/revenue')) return 'revenue';
    if (path.startsWith('/costs')) return 'costs';
    if (path.startsWith('/capex')) return 'capex';
    if (path.startsWith('/pnl')) return 'pnl';
    if (path.startsWith('/cashflow')) return 'cashflow';
    if (path.startsWith('/balance-sheet')) return 'balance-sheet';
    if (path.startsWith('/scenario')) return 'scenario';
    if (path.startsWith('/workflow')) return 'workflow';
    if (path.startsWith('/export')) return 'export';
    if (path.startsWith('/admin/users')) return 'admin-users';
    if (path.startsWith('/admin/coa')) return 'admin-coa';
    if (path.startsWith('/admin/departments')) return 'admin-depts';
    if (path.startsWith('/admin/audit')) return 'admin-audit';
    return '';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard': navigate('/'); break;
      case 'cycles': navigate('/cycles'); break;
      case 'revenue': navigate('/revenue'); break;
      case 'costs': navigate('/costs'); break;
      case 'capex': navigate('/capex'); break;
      case 'pnl': navigate('/pnl'); break;
      case 'cashflow': navigate('/cashflow'); break;
      case 'balance-sheet': navigate('/balance-sheet'); break;
      case 'scenario': navigate('/scenario'); break;
      case 'workflow': navigate('/workflow'); break;
      case 'export': navigate('/export'); break;
      case 'admin-users': navigate('/admin/users'); break;
      case 'admin-coa': navigate('/admin/coa'); break;
      case 'admin-depts': navigate('/admin/departments'); break;
      case 'admin-audit': navigate('/admin/audit'); break;
    }
  };

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'finance_manager';

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      type: 'group' as const,
      label: collapsed ? null : 'Penyusunan RKAP',
      children: [
        {
          key: 'cycles',
          icon: <CalendarOutlined />,
          label: 'Siklus RKAP',
        },
        {
          key: 'revenue',
          icon: <LineChartOutlined />,
          label: 'Anggaran Pendapatan',
        },
        {
          key: 'costs',
          icon: <DollarOutlined />,
          label: 'Anggaran Biaya',
        },
        {
          key: 'capex',
          icon: <BuildOutlined />,
          label: 'Anggaran CapEx',
        },
      ],
    },
    {
      type: 'group' as const,
      label: collapsed ? null : 'Proyeksi Keuangan',
      children: [
        {
          key: 'pnl',
          icon: <PieChartOutlined />,
          label: 'Proyeksi Laba Rugi',
        },
        {
          key: 'cashflow',
          icon: <SolutionOutlined />,
          label: 'Proyeksi Arus Kas',
        },
        {
          key: 'balance-sheet',
          icon: <AccountBookOutlined />,
          label: 'Proyeksi Neraca',
        },
        {
          key: 'scenario',
          icon: <SlidersOutlined />,
          label: 'Analisis Skenario',
        },
      ],
    },
    {
      type: 'group' as const,
      label: collapsed ? null : 'Fitur Pendukung',
      children: [
        {
          key: 'workflow',
          icon: <SolutionOutlined />,
          label: 'Workflow Approval',
        },
        {
          key: 'export',
          icon: <ExportOutlined />,
          label: 'Laporan & Ekspor',
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            type: 'group' as const,
            label: collapsed ? null : 'Administrasi',
            children: [
              {
                key: 'admin-users',
                icon: <UserOutlined />,
                label: 'Manajemen User',
              },
              {
                key: 'admin-depts',
                icon: <ClusterOutlined />,
                label: 'Departemen',
              },
              {
                key: 'admin-coa',
                icon: <BookOutlined />,
                label: 'Chart of Accounts',
              },
              {
                key: 'admin-audit',
                icon: <HistoryOutlined />,
                label: 'Log Audit',
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={260}
      collapsedWidth={72}
      className="glass-card"
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">CP</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            Cor<span>Plan</span>
          </div>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getActiveKey()]}
        onClick={handleMenuClick}
        items={menuItems}
        style={{ borderRight: 0, paddingBottom: 24 }}
      />
    </Sider>
  );
};
