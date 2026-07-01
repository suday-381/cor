import React, { useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Alert, Tooltip } from 'antd';
import { PercentageOutlined, ArrowUpOutlined, FallOutlined, RiseOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { FinancialTable, FinancialRow } from '@/components/common/FinancialTable';

const { Title, Text, Paragraph } = Typography;

export const PnlPage: React.FC = () => {
  const { selectedCycleId, pnlSnapshot, recalculateAll, cycles } = useAppStore();

  useEffect(() => {
    recalculateAll();
  }, [selectedCycleId]);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);

  const calculateSum = (mv: any) => {
    if (!mv) return 0;
    return Object.values(mv as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
  };

  const getPnlRows = (): FinancialRow[] => {
    if (!pnlSnapshot) return [];

    const summary = pnlSnapshot.summary;

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
          Object.entries(summary.cogs).map(([k, v]) => [k, -v])
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
          Object.entries(summary.operatingExpenses).map(([k, v]) => [k, -v])
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
          Object.entries(summary.depreciation).map(([k, v]) => [k, -v])
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
          Object.entries(summary.interestExpense).map(([k, v]) => [k, -v])
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
          Object.entries(summary.incomeTax).map(([k, v]) => [k, -v])
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

  const totalRevenue = calculateSum(pnlSnapshot?.summary.grossRevenue);
  const totalCogs = calculateSum(pnlSnapshot?.summary.cogs);
  const totalOpex = calculateSum(pnlSnapshot?.summary.operatingExpenses);
  const totalNetIncome = calculateSum(pnlSnapshot?.summary.netIncome);

  const grossProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;
  const netProfitMargin = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>Proyeksi Laba Rugi (P&L)</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Konsolidasi otomatis seluruh input target pendapatan dan beban operasional menjadi laporan Proyeksi Laba Rugi multi-periode.
        </Paragraph>
      </div>

      {/* KPI Stats */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>TOTAL PENDAPATAN KOTOR</span>}
              value={totalRevenue}
              formatter={v => <span className="font-mono" style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{formatCurrency(Number(v))}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>TOTAL BEBAN OPERASIONAL</span>}
              value={totalOpex}
              formatter={v => <span className="font-mono" style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{formatCurrency(Number(v))}</span>}
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
      />
    </div>
  );
};
