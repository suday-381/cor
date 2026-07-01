import React, { useState } from 'react';
import { Card, Table, Typography, Input, Select, Space, Row, Col, Tag } from 'antd';
import { SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';

const { Title, Text, Paragraph } = Typography;

export const SystemSettingsPage: React.FC = () => {
  const { auditLogs } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const columns = [
    {
      title: 'Waktu Aktivitas',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (text: string) => <span className="font-mono text-muted">{new Date(text).toLocaleString('id-ID')}</span>
    },
    {
      title: 'Pengguna',
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
      render: (text: string) => <Text strong style={{ color: '#fff' }}>{text}</Text>
    },
    {
      title: 'Tindakan',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (text: string) => {
        let color = 'default';
        if (text === 'create') color = 'success';
        if (text === 'update') color = 'processing';
        if (text === 'delete') color = 'error';
        if (text === 'approve') color = 'success';
        if (text === 'submit') color = 'warning';
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Modul / Entitas',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 180,
      render: (text: string) => <Tag color="purple">{text}</Tag>
    },
    {
      title: 'Deskripsi Detail Aktivitas',
      dataIndex: 'details',
      key: 'details',
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      className: 'font-mono text-muted'
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      log.details.toLowerCase().includes(searchText.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchText.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>Log Audit Keamanan</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Daftar rekam jejak aktivitas operasional pengguna (audit trail) untuk memantau keamanan dan kepatuhan sistem.
        </Paragraph>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Input
              placeholder="Cari berdasarkan nama pengguna, modul, rincian aktivitas..."
              prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              value={filterAction}
              onChange={setFilterAction}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'Semua Tindakan' },
                { value: 'create', label: 'Baru (Create)' },
                { value: 'update', label: 'Ubah (Update)' },
                { value: 'delete', label: 'Hapus (Delete)' },
                { value: 'submit', label: 'Submit Workflow' },
                { value: 'approve', label: 'Setujui (Approve)' },
                { value: 'reject', label: 'Tolak (Reject)' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <HistoryOutlined style={{ color: '#10B981' }} />
            <span style={{ color: '#fff' }}>Riwayat Aktivitas Pengguna</span>
          </Space>
        }
      >
        <Table
          dataSource={filteredLogs}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 12 }}
          size="middle"
        />
      </Card>
    </div>
  );
};
