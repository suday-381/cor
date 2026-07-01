import React, { useState, useEffect } from 'react';
import { Layout, Breadcrumb } from 'antd';
import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '@/stores/appStore';
import { motion, AnimatePresence } from 'framer-motion';

const { Content } = Layout;

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentUser = useAppStore(state => state.currentUser);
  const loadInitialData = useAppStore(state => state.loadInitialData);
  const loadCycleData = useAppStore(state => state.loadCycleData);
  const selectedCycleId = useAppStore(state => state.selectedCycleId);

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser, loadInitialData]);

  useEffect(() => {
    if (currentUser && selectedCycleId) {
      loadCycleData(selectedCycleId);
    }
  }, [currentUser, selectedCycleId, loadCycleData]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Generate breadcrumbs from path
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    if (pathnames.length === 0) {
      return [{ title: 'Dashboard', link: '/' }];
    }

    const items = [{ title: 'Dashboard', link: '/' }];
    let currentPath = '';

    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      // Format label
      let title = name.charAt(0).toUpperCase() + name.slice(1);
      if (name === 'coa') title = 'Chart of Accounts';
      if (name === 'depts' || name === 'departments') title = 'Departemen';
      if (name === 'pnl') title = 'Proyeksi Laba Rugi';
      if (name === 'cashflow') title = 'Proyeksi Arus Kas';
      if (name === 'balance-sheet') title = 'Proyeksi Neraca';
      if (name === 'workflow') title = 'Workflow Approval';
      if (name === 'export') title = 'Laporan & Ekspor';
      if (name === 'users') title = 'Manajemen User';
      if (name === 'audit') title = 'Log Audit';
      if (name === 'cycles') title = 'Siklus RKAP';

      // Skip dynamic IDs from showing directly if possible
      if (name.startsWith('c-') || name.startsWith('rev-') || name.startsWith('cost-')) {
        title = name.toUpperCase();
      }

      items.push({
        title,
        link: index === pathnames.length - 1 ? '' : currentPath,
      });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbs();

  return (
    <Layout style={{ minHeight: '100vh', background: '#0B0F1A' }}>
      {/* Dynamic Animated BG */}
      <div className="animated-bg" />

      <Sidebar collapsed={collapsed} />

      <Layout>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />

        <Content style={{ overflow: 'initial' }}>
          <div className="content-area">
            {/* Breadcrumbs */}
            <Breadcrumb style={{ marginBottom: 16 }}>
              {breadcrumbItems.map((item, idx) => (
                <Breadcrumb.Item key={idx}>
                  {item.link ? (
                    <Link to={item.link} style={{ color: 'rgba(255,255,255,0.45)' }}>{item.title}</Link>
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 500 }}>{item.title}</span>
                  )}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>

            {/* Page content with smooth route transition animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
