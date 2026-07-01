import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AppRoutes } from './routes';
import idID from 'antd/locale/id_ID';
import '@/styles/index.css';

export const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={idID}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#10B981', // Emerald green
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#3B82F6',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          borderRadius: 8,
        },
        components: {
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'transparent',
            siderBg: 'transparent',
          },
          Card: {
            colorBgContainer: 'rgba(17, 24, 39, 0.7)',
          },
          Table: {
            colorBgContainer: 'transparent',
          },
          Select: {
            colorBgContainer: '#1a2236',
          },
          Input: {
            colorBgContainer: '#1a2236',
          },
          InputNumber: {
            colorBgContainer: '#1a2236',
          },
        },
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
