import React, { useEffect, useState, useMemo } from 'react';
import { Card, Table, Typography, Space, Tag, Button, Input, Select } from 'antd';
import { EyeOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/utils/api';
import { ApprovalWorkflow } from '@/types';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');
const { Title, Paragraph } = Typography;

export const SubmissionListPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCycleId, cycles, departments, currentUser } = useAppStore();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  
  const isGlobalRole = currentUser && ['super_admin', 'csp', 'cfo'].includes(currentUser.role);
  
  useEffect(() => {
    const fetchWorkflows = async () => {
      if (!selectedCycleId) return;
      setLoading(true);
      try {
        const res = await api.get<ApprovalWorkflow[]>('/workflow/divisions', { cycleId: selectedCycleId });
        setWorkflows(res);
      } catch (err) {
        console.error('Failed to fetch division workflows', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflows();
  }, [selectedCycleId]);

  // Determine allowed divisions for current user
  const userDept = departments.find(d => d.id === currentUser?.departmentId);
  const userDivisionId = userDept?.parentId || userDept?.id;

  const filteredWorkflows = useMemo(() => {
    let filtered = workflows;
    
    // RBAC filter
    if (!isGlobalRole && userDivisionId) {
      filtered = filtered.filter(wf => wf.departmentId === userDivisionId);
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(wf => wf.status === statusFilter);
    }
    
    // Search filter (by division name or submission name)
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(wf => {
        const dept = departments.find(d => d.id === wf.departmentId);
        const deptName = dept ? dept.name.toLowerCase() : '';
        const subName = wf.submissionName ? wf.submissionName.toLowerCase() : '';
        return deptName.includes(lowerSearch) || subName.includes(lowerSearch);
      });
    }
    
    return filtered;
  }, [workflows, statusFilter, searchText, isGlobalRole, userDivisionId, departments]);

  const getStatusTag = (status: string, stageName?: string) => {
    switch (status) {
      case 'approved':
        return <Tag color="success">Disetujui</Tag>;
      case 'rejected':
        return <Tag color="error">Ditolak / Revisi</Tag>;
      case 'in_progress':
        return <Tag color="processing">Menunggu Review: {stageName || 'Tahap Selanjutnya'}</Tag>;
      case 'draft':
      default:
        return <Tag color="default">Draft</Tag>;
    }
  };

  const columns = [
    {
      title: 'Divisi',
      dataIndex: 'departmentId',
      key: 'departmentId',
      render: (deptId: string) => {
        const dept = departments.find(d => d.id === deptId);
        return <span style={{ fontWeight: 600, color: '#fff' }}>{dept ? dept.name : deptId}</span>;
      }
    },
    {
      title: 'Nama Pengajuan',
      dataIndex: 'submissionName',
      key: 'submissionName',
      render: (name: string, record: ApprovalWorkflow) => (
        <Space direction="vertical" size={2}>
          <span style={{ color: '#fff' }}>{name || '-'}</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Versi: {record.submissionVersion || 1}</span>
        </Space>
      )
    },
    {
      title: 'Status Saat Ini',
      key: 'status',
      render: (_: any, record: ApprovalWorkflow) => {
        const currentStage = record.stages && record.stages.length > 0 && record.currentStageIndex < record.stages.length
          ? record.stages[record.currentStageIndex]
          : undefined;
        return getStatusTag(record.status, currentStage?.stageName);
      }
    },
    {
      title: 'Tanggal Update Terakhir',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => <span style={{ color: 'rgba(255,255,255,0.65)' }}>{date ? dayjs(date).format('DD MMM YYYY, HH:mm') : '-'}</span>
    },
    {
      title: 'Aksi',
      key: 'actions',
      render: (_: any, record: ApprovalWorkflow) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => {
            // Kita bisa navigasi ke workflow page spesifik divisi ini dengan parameter URL
            navigate(`/workflow?departmentId=${record.departmentId}`);
          }}
        >
          Detail
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>List Pengajuan RKAP</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Pantau status pengajuan RKAP dari seluruh divisi. Anda dapat melihat detail persetujuan dan komentar revisi.
          </Paragraph>
        </div>
      </div>
      
      <Card 
        title={
          <span style={{ color: '#fff' }}>Daftar Pengajuan (Siklus {activeCycle?.fiscalYear || '-'})</span>
        }
        extra={
          <Space>
            <Input 
              placeholder="Cari Divisi atau Pengajuan..." 
              prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250, backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }}
            />
            <Select
              placeholder="Status"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              dropdownStyle={{ backgroundColor: '#111827' }}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'rejected', label: 'Revisi' },
                { value: 'approved', label: 'Approved' },
              ]}
              suffixIcon={<FilterOutlined />}
            />
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={filteredWorkflows} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
