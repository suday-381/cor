import React, { useEffect } from 'react';
import { Row, Col, Card, Space, Typography, Table, Tag, Button, Tooltip, Steps } from 'antd';
import { Column, Pie } from '@ant-design/charts';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';

const { Title, Text, Paragraph } = Typography;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    selectedCycleId,
    cycles,
    pnlSnapshot,
    cashFlowSnapshot,
    workflow,
    auditLogs,
    recalculateAll,
  } = useAppStore();

  useEffect(() => {
    recalculateAll();
  }, [selectedCycleId]);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);

  // Financial calculations
  const calculateTotal = (mv: any) => {
    if (!mv) return 0;
    return Object.values(mv as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
  };

  const totalRevenue = calculateTotal(pnlSnapshot?.summary.grossRevenue);
  const totalCogs = calculateTotal(pnlSnapshot?.summary.cogs);
  const totalOpex = calculateTotal(pnlSnapshot?.summary.operatingExpenses);
  const netIncome = calculateTotal(pnlSnapshot?.summary.netIncome);

  const closingCash = cashFlowSnapshot ? Object.values(cashFlowSnapshot.closingCash)[11] : 0;
  const netCashFlow = calculateTotal(cashFlowSnapshot?.netCashFlow);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatPercentage = (val: number) => {
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  // Mock comparison stats vs last year
  const revGrowth = 8.5;
  const opexChange = 3.2;
  const netIncGrowth = 12.4;

  const currentStage = workflow?.stages[workflow.currentStageIndex];
  const pendingApprovalsCount = workflow?.status === 'in_progress' && currentStage?.approverRole === currentUser?.role ? 1 : 0;

  // Chart data calculation
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const revData = pnlSnapshot ? Object.values(pnlSnapshot.summary.grossRevenue) : [];

  const columnData = months.map((month, idx) => ({
    month,
    revenue: revData[idx] || 0,
  }));

  const columnConfig = {
    data: columnData,
    xField: 'month',
    yField: 'revenue',
    style: {
      fill: '#10B981',
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
    tooltip: {
      channel: 'y',
      valueFormatter: (v: number) => formatCurrency(v),
    },
  };

  // Donut chart calculation
  const totalDepreciation = pnlSnapshot ? calculateTotal(pnlSnapshot.summary.depreciation) : 0;
  const totalInterest = pnlSnapshot ? calculateTotal(pnlSnapshot.summary.interestExpense) : 0;
  const totalTax = pnlSnapshot ? calculateTotal(pnlSnapshot.summary.incomeTax) : 0;

  const donutData = [
    { type: 'COGS (Bahan Baku & Produksi)', value: totalCogs },
    { type: 'OPEX (Beban Operasional)', value: totalOpex },
    { type: 'Depresiasi & Amortisasi', value: totalDepreciation },
    { type: 'Beban Bunga', value: totalInterest },
    { type: 'Pajak Penghasilan', value: totalTax },
    { type: 'Proyeksi Laba Bersih', value: netIncome },
  ].filter(item => item.value > 0);

  const donutConfig = {
    data: donutData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    tooltip: {
      valueFormatter: (v: number) => formatCurrency(v),
    },
    legend: {
      color: {
        position: 'right',
        layout: {
          justifyContent: 'center',
        },
      },
    },
  };

  const auditColumns = [
    {
      title: 'Waktu',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (text: string) => <span className="font-mono text-muted">{new Date(text).toLocaleTimeString('id-ID')}</span>
    },
    {
      title: 'Pengguna',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
      render: (text: string) => <Text strong style={{ color: '#fff' }}>{text}</Text>
    },
    {
      title: 'Tindakan',
      dataIndex: 'action',
      key: 'action',
      width: 100,
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
      title: 'Rincian',
      dataIndex: 'details',
      key: 'details',
    }
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>Halo, {currentUser?.name} 👋</Title>
          <Paragraph style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.45)' }}>
            Selamat datang di dashboard Corporate Financial Planning. Anda masuk sebagai <Text strong style={{ color: '#10B981' }}>{currentUser?.role.replace('_', ' ').toUpperCase()}</Text>.
          </Paragraph>
        </div>
        <div>
          <Space>
            <CalendarOutlined style={{ color: '#10B981', fontSize: '18px' }} />
            <Text style={{ color: '#fff' }}>Tahun Anggaran Aktif: <Text strong style={{ color: '#10B981' }}>RKAP {activeCycle?.fiscalYear}</Text></Text>
          </Space>
        </div>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-label">TOTAL PENDAPATAN</div>
            <div className="kpi-value">{formatCurrency(totalRevenue)}</div>
            <div className="kpi-change">
              <span className="text-positive"><ArrowUpOutlined /> {formatPercentage(revGrowth)}</span>
              <span className="text-muted">vs tahun lalu</span>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-label">TOTAL BIAYA OPERASIONAL (OPEX)</div>
            <div className="kpi-value">{formatCurrency(totalOpex)}</div>
            <div className="kpi-change">
              <span className="text-negative"><ArrowUpOutlined /> {formatPercentage(opexChange)}</span>
              <span className="text-muted">vs tahun lalu</span>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-label">PROYEKSI LABA BERSIH</div>
            <div className="kpi-value" style={{ color: netIncome > 0 ? '#10B981' : '#EF4444' }}>
              {formatCurrency(netIncome)}
            </div>
            <div className="kpi-change">
              <span className={netIncome > 0 ? 'text-positive' : 'text-negative'}>
                {netIncome > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {formatPercentage(netIncGrowth)}
              </span>
              <span className="text-muted">vs tahun lalu</span>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-label">SALDO KAS AKHIR TAHUN</div>
            <div className="kpi-value" style={{ color: '#6366F1' }}>{formatCurrency(closingCash)}</div>
            <div className="kpi-change">
              <span className={netCashFlow > 0 ? 'text-positive' : 'text-negative'}>
                {netCashFlow > 0 ? 'Surplus' : 'Defisit'} Kas: {formatCurrency(Math.abs(netCashFlow))}
              </span>
            </div>
          </div>
        </Col>
      </Row>

      {/* Row 2: Revenue Trend & Allocation */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title={<span style={{ color: '#fff' }}>Tren Rencana Pendapatan Bulanan (RKAP {activeCycle?.fiscalYear})</span>}>
            <div style={{ height: 260 }}>
              <Column {...columnConfig} />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<span style={{ color: '#fff' }}>Alokasi & Proyeksi Keuangan (P&L)</span>}>
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pie {...donutConfig} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Audit Trail & Workflow Status */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AuditOutlined style={{ color: '#10B981' }} />
                <span style={{ color: '#fff' }}>Log Aktivitas Terkini (Audit Trail)</span>
              </div>
            }
            extra={
              <Button type="text" size="small" onClick={() => navigate('/admin/audit')} style={{ color: '#10B981' }}>
                Lihat Semua Log <RightOutlined />
              </Button>
            }
          >
            <Table
              dataSource={auditLogs.slice(0, 5)}
              columns={auditColumns}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<span style={{ color: '#fff' }}>Status Alur Kerja & Tindakan</span>} style={{ height: '100%' }}>
            {workflow && (
              <div style={{ marginBottom: 20 }}>
                <Steps
                  direction="vertical"
                  size="small"
                  current={workflow.currentStageIndex}
                  status={workflow.status === 'rejected' ? 'error' : 'process'}
                  items={workflow.stages.map((stage, idx) => ({
                    title: stage.stageName,
                    description: (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                        Persetujuan: {stage.approverName} ({stage.approverRole.replace('_', ' ').toUpperCase()})
                        {stage.status === 'approved' && <Tag color="success" style={{ marginLeft: 8 }}>DISETUJUI</Tag>}
                        {stage.status === 'rejected' && <Tag color="error" style={{ marginLeft: 8 }}>DITOLAK</Tag>}
                        {stage.status === 'pending' && idx === workflow.currentStageIndex && <Tag color="warning" style={{ marginLeft: 8 }}>MENUNGGU</Tag>}
                      </div>
                    ),
                  }))}
                />
              </div>
            )}

            {pendingApprovalsCount > 0 ? (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                  <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#F59E0B', marginTop: 4 }} />
                  <div>
                    <Text strong style={{ color: '#fff', fontSize: '0.9rem' }}>Persetujuan RKAP {activeCycle?.fiscalYear} Ditangguhkan</Text>
                    <Paragraph style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                      Siklus ini sedang berada pada tahap <Text strong style={{ color: '#fff' }}>"{currentStage?.stageName}"</Text> dan memerlukan tindakan persetujuan Anda.
                    </Paragraph>
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<RightOutlined />}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none' }}
                  onClick={() => navigate('/workflow')}
                >
                  Tinjau & Setujui Sekarang
                </Button>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: '32px', color: '#10B981', marginBottom: 8 }} />
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>Semua Pekerjaan Selesai</div>
                <Paragraph style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginTop: 4, marginBottom: 0 }}>
                  Tidak ada pengajuan RKAP yang memerlukan persetujuan atau tindakan Anda saat ini.
                </Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
