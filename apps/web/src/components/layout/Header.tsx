import React from 'react';
import { Layout, Button, Dropdown, Space, Avatar, Badge, Select, Typography, Tag, Divider, List } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  LockOutlined,
  SyncOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { UserRole, ROLE_LABELS, ROLE_COLORS, CYCLE_STATUS_LABELS } from '@/types';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const {
    currentUser,
    users,
    login,
    logout,
    cycles,
    selectedCycleId,
    selectCycle,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppStore();

  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const unreadNotifications = notifications.filter(n => !n.isRead);

  const handleRoleSwitch = (role: UserRole) => {
    // find a user with this role
    const userWithRole = users.find(u => u.role === role);
    if (userWithRole) {
      login(userWithRole.email, role);
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'draft': return <Tag color="default">{CYCLE_STATUS_LABELS.draft}</Tag>;
      case 'in_review': return <Tag color="warning" icon={<SyncOutlined spin />}>{CYCLE_STATUS_LABELS.in_review}</Tag>;
      case 'approved': return <Tag color="success" icon={<CheckCircleOutlined />}>{CYCLE_STATUS_LABELS.approved}</Tag>;
      case 'published': return <Tag color="processing">{CYCLE_STATUS_LABELS.published}</Tag>;
      case 'locked': return <Tag color="error" icon={<LockOutlined />}>{CYCLE_STATUS_LABELS.locked}</Tag>;
      default: return null;
    }
  };

  // Notification menu
  const notificationMenu = (
    <div style={{
      width: 320,
      backgroundColor: '#111827',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ color: '#fff' }}>Notifikasi</Text>
        {unreadNotifications.length > 0 && (
          <Button type="link" size="small" onClick={markAllNotificationsAsRead} style={{ padding: 0 }}>
            Tandai semua dibaca
          </Button>
        )}
      </div>
      <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.06)' }} />
      <List
        size="small"
        dataSource={notifications.slice(0, 5)}
        locale={{ emptyText: <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '12px 0' }}>Tidak ada notifikasi baru</Text> }}
        renderItem={item => (
          <List.Item
            style={{
              padding: '8px 4px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              opacity: item.isRead ? 0.6 : 1,
            }}
            onClick={() => {
              markNotificationAsRead(item.id);
              if (item.link) navigate(item.link);
            }}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<FileTextOutlined />} style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }} />}
              title={<span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: item.isRead ? 500 : 600 }}>{item.title}</span>}
              description={<span style={{ color: '#9CA3AF', fontSize: '0.78rem' }}>{item.message}</span>}
            />
          </List.Item>
        )}
      />
    </div>
  );

  // User Profile Menu
  const userMenu = (
    <div style={{
      width: 240,
      backgroundColor: '#111827',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '12px 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    }}>
      <div style={{ padding: '0 16px 8px 16px' }}>
        <Text strong style={{ color: '#fff', display: 'block' }}>{currentUser?.name}</Text>
        <Text type="secondary" style={{ fontSize: '0.8rem' }}>{currentUser?.email}</Text>
        <div style={{ marginTop: 6 }}>
          <Tag color={ROLE_COLORS[currentUser?.role || 'viewer']}>
            {ROLE_LABELS[currentUser?.role || 'viewer']}
          </Tag>
        </div>
      </div>
      <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.06)' }} />

      <div style={{ padding: '8px 16px' }}>
        <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginBottom: 6 }}>Simulasi Peran:</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={currentUser?.role}
          onChange={handleRoleSwitch}
          dropdownStyle={{ backgroundColor: '#111827' }}
          options={Object.entries(ROLE_LABELS).map(([role, label]) => ({
            value: role,
            label: `Beralih ke ${label}`
          }))}
        />
      </div>

      <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.06)' }} />
      <div style={{ padding: '0 8px' }}>
        <Button
          type="text"
          danger
          icon={<LogoutOutlined />}
          style={{ width: '100%', textAlign: 'left' }}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <AntHeader className="app-header">
      <div className="app-header-left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ fontSize: '16px', color: '#fff' }}
        />

        <Space align="center" style={{ marginLeft: 8 }}>
          <Text style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Tahun Anggaran:</Text>
          <Select
            value={selectedCycleId}
            onChange={selectCycle}
            style={{ width: 140 }}
            dropdownStyle={{ backgroundColor: '#111827' }}
            options={cycles.map(c => ({
              value: c.id,
              label: `RKAP ${c.fiscalYear}`
            }))}
          />
          {activeCycle && getStatusTag(activeCycle.status)}
        </Space>
      </div>

      <div className="app-header-right">
        <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
          <Badge count={unreadNotifications.length} size="small" offset={[-2, 6]}>
            <div className="notification-bell">
              <BellOutlined style={{ fontSize: '20px', color: '#fff' }} />
            </div>
          </Badge>
        </Dropdown>

        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }} className="header-user">
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: 'rgba(16,185,129,0.2)', color: '#10B981' }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <Text strong style={{ color: '#fff', fontSize: '0.85rem' }}>{currentUser?.name}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{ROLE_LABELS[currentUser?.role || 'viewer']}</Text>
            </div>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
};
