import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Statistic, Select, Space, Tag, Tooltip } from 'antd';
import { PercentageOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { FinancialTable, FinancialRow } from '@/components/common/FinancialTable';
import { formatCurrency } from '@/utils/format';
import { api } from '@/utils/api';
import { PnlSnapshot } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const PnlPage: React.FC = () => {
  const { selectedCycleId, cycles, displayUnit, currentUser, departments } = useAppStore();
  const [selectedDivId, setSelectedDivId] = useState<string>('all');
  const [pnlData, setPnlData] = useState<PnlSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [divisionList, setDivisionList] = useState<any[]>([]);

  const userDept = departments.find(d => d.id === currentUser?.departmentId);
  const userDivId = userDept ? (userDept.parentId || userDept.id) : '';
  const isGlobalUser = ['super_admin', 'csp', 'cfo'].includes(currentUser?.role || '');

  // Load divisions list with workflow status
  useEffect(() => {
    if (selectedCycleId) {
      api.get<any[]>('/workflow/divisions', { cycleId: selectedCycleId })
        .then(res => setDivisionList(res))
        .catch(err => console.error(err));
    }
  }, [selectedCycleId]);

  // Load Pnl data based on selected cycle and division
  useEffect(() => {
    if (selectedCycleId && departments.length > 0) {
      setLoading(true);
      const activeDivId = isGlobalUser ? selectedDivId : userDivId;
      api.get<PnlSnapshot>('/projections/pnl', {
        cycleId: selectedCycleId,
        divisionId: activeDivId === 'all' ? undefined : activeDivId
      })
      .then(res => {
        setPnlData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setPnlData(null);
        setLoading(false);
      });
    }
  }, [selectedCycleId, selectedDivId, currentUser, departments, isGlobalUser, userDivId]);

  // Sync default select value on user change
  useEffect(() => {
    if (!isGlobalUser && userDivId) {
      setSelectedDivId(userDivId);
    } else if (isGlobalUser) {
      setSelectedDivId('all');
    }
  }, [isGlobalUser, userDivId]);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);

  const calculateSum = (mv: any) => {
    if (!mv) return 0;
    return Object.values(mv as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
  };

  const getPnlRows = (): FinancialRow[] => {
    if (!pnlData) return [];

    const summary = pnlData.summary;

    return [
      {
        key: 'rev-section',
        name: 'PENDAPATAN',
        isHeader: true,
        values: summary.grossRevenue
      },
      {
        key: 'gross-rev',
        name: 'Pendapatan Kotor',
        indent: 1,
        tooltip: 'Total akumulasi dari seluruh target revenue produk dan channel',
        values: summary.grossRevenue
      },
      {
        key: 'cogs',
        name: 'Harga Pokok Penjualan (COGS)',
        indent: 1,
        tooltip: 'Beban langsung terkait produksi atau pengadaan bahan baku',
        values: Object.fromEntries(
          Object.entries(summary.cogs || {}).map(([k, v]) => [k, -v])
        ) as any
      },
      {
        key: 'gross-profit',
        name: 'LABA KOTOR',
        isSubtotal: true,
        tooltip: 'Pendapatan Kotor dikurangi COGS',
        values: summary.grossProfit
      },
      {
        key: 'opex-section',
        name: 'BEBAN OPERASIONAL (OPEX)',
        isHeader: true,
        values: summary.operatingExpenses
      },
      {
        key: 'opex-total',
        name: 'Beban Operasional',
        indent: 1,
        tooltip: 'Beban operasional umum, gaji karyawan, marketing, administrasi, dll',
        values: Object.fromEntries(
          Object.entries(summary.operatingExpenses || {}).map(([k, v]) => [k, -v])
        ) as any
      },
      {
        key: 'ebitda',
        name: 'EBITDA',
        isSubtotal: true,
        tooltip: 'Earnings Before Interest, Taxes, Depreciation & Amortization',
        values: summary.ebitda
      },
      {
        key: 'depr',
        name: 'Beban Depresiasi & Amortisasi',
        indent: 1,
        tooltip: 'Depresiasi aset tetap bulanan',
        values: Object.fromEntries(
          Object.entries(summary.depreciation || {}).map(([k, v]) => [k, -v])
        ) as any
      },
      {
        key: 'ebit',
        name: 'LABA OPERASI (EBIT)',
        isSubtotal: true,
        tooltip: 'Earnings Before Interest & Taxes',
        values: summary.ebit
      },
      {
        key: 'interest',
        name: 'Beban Bunga Pinjaman',
        indent: 1,
        tooltip: 'Beban bunga bulanan atas utang bank',
        values: Object.fromEntries(
          Object.entries(summary.interestExpense || {}).map(([k, v]) => [k, -v])
        ) as any
      },
      {
        key: 'ebt',
        name: 'LABA SEBELUM PAJAK (EBT)',
        isSubtotal: true,
        tooltip: 'Earnings Before Taxes',
        values: summary.ebt
      },
      {
        key: 'tax',
        name: 'Pajak Penghasilan (PPh)',
        indent: 1,
        tooltip: 'Dihitung otomatis berdasarkan tarif PPh yang dikonfigurasi di asumsi makro',
        values: Object.fromEntries(
          Object.entries(summary.incomeTax || {}).map(([k, v]) => [k, -v])
        ) as any
      },
      {
        key: 'net-income',
        name: 'LABA BERSIH',
        isTotal: true,
        tooltip: 'Laba bersih yang siap ditransfer ke Retained Earnings di Neraca',
        values: summary.netIncome
      }
    ];
  };

  const totalRevenue = pnlData ? calculateSum(pnlData.summary.grossRevenue) : 0;
  const totalCogs = pnlData ? calculateSum(pnlData.summary.cogs) : 0;
  const totalOpex = pnlData ? calculateSum(pnlData.summary.operatingExpenses) : 0;
  const totalNetIncome = pnlData ? calculateSum(pnlData.summary.netIncome) : 0;

  const grossProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;
  const netProfitMargin = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;

  // Dropdown options
  const divs = departments.filter(d => !d.parentId);
  const divOptions = [
    { value: 'all', label: 'Semua Divisi (Global)' },
    ...divs.map(d => ({ value: d.id, label: d.name }))
  ];

  const renderChecklist = () => {
    if (!isGlobalUser || selectedDivId !== 'all') return null;
    return (
      <Card
        title={<span style={{ color: '#fff', fontSize: '0.95rem' }}>Status Approval Divisi (Masuk Proyeksi Global)</span>}
        style={{ marginBottom: 20, background: '#111827', borderColor: 'rgba(255,255,255,0.06)' }}
        bodyStyle={{ padding: 12 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {divisionList.map(div => {
            const isApproved = div.documentStatus === 'Approve';
            return (
              <div
                key={div.divisionId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  background: isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 6,
                  border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`
                }}
              >
                <span style={{ color: isApproved ? '#10B981' : '#9CA3AF', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                  {isApproved ? '☑' : '☐'}
                </span>
                <Text style={{ color: isApproved ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: isApproved ? 500 : 400 }}>
                  {div.divisionName}
                </Text>
                <Tag color={isApproved ? 'success' : (div.documentStatus === 'Reject' ? 'error' : 'default')} style={{ margin: 0, fontSize: '0.7rem' }}>
                  {div.documentStatus || 'Draft'}
                </Tag>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Proyeksi Laba Rugi (P&L)</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Konsolidasi otomatis seluruh input target pendapatan dan beban operasional divisi menjadi laporan Proyeksi Laba Rugi.
          </Paragraph>
        </div>
        <Space align="center">
          <span style={{ color: '#9CA3AF' }}>Filter Divisi:</span>
          <Select
            value={isGlobalUser ? selectedDivId : userDivId}
            onChange={setSelectedDivId}
            disabled={!isGlobalUser}
            style={{ width: 280 }}
            dropdownStyle={{ backgroundColor: '#111827' }}
            options={divOptions}
          />
        </Space>
      </div>

      {renderChecklist()}

      {/* KPI Stats */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>TOTAL PENDAPATAN KOTOR</span>}
              value={totalRevenue}
              formatter={v => <span className="font-mono" style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{formatCurrency(Number(v), displayUnit)}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>TOTAL BEBAN OPERASIONAL</span>}
              value={totalOpex}
              formatter={v => <span className="font-mono" style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{formatCurrency(Number(v), displayUnit)}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>GROSS PROFIT MARGIN</span>
                  <Tooltip title="Laba Kotor / Total Pendapatan"><PercentageOutlined style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} /></Tooltip>
                </div>
              }
              value={grossProfitMargin}
              precision={1}
              formatter={v => <span className="font-mono text-positive" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{v}%</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>NET PROFIT MARGIN</span>
                  <Tooltip title="Laba Bersih / Total Pendapatan"><PercentageOutlined style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} /></Tooltip>
                </div>
              }
              value={netProfitMargin}
              precision={1}
              formatter={v => (
                <span className={`font-mono ${Number(v) >= 0 ? 'text-positive' : 'text-negative'}`} style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                  {Number(v) >= 0 ? <RiseOutlined style={{ marginRight: 4 }} /> : <FallOutlined style={{ marginRight: 4 }} />}
                  {v}%
                </span>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* P&L Table */}
      <FinancialTable
        title={`Proyeksi Laba Rugi — RKAP ${activeCycle?.fiscalYear}`}
        rows={getPnlRows()}
        loading={loading}
      />
    </div>
  );
};
