import React, { useState } from 'react';
import { Card, Row, Col, Typography, Slider, Table, Statistic, Divider, Space } from 'antd';
import { Column } from '@ant-design/charts';
import { useAppStore } from '@/stores/appStore';

const { Title, Text, Paragraph } = Typography;

export const ScenarioPage: React.FC = () => {
  const { pnlSnapshot, cashFlowSnapshot, cycles, selectedCycleId } = useAppStore();

  const activeCycle = cycles.find(c => c.id === selectedCycleId);

  // Levers state
  const [bullRevGrowth, setBullRevGrowth] = useState<number>(12); // +12% growth
  const [bullOpexSaving, setBullOpexSaving] = useState<number>(6); // 6% opex savings
  
  const [bearRevDecline, setBearRevDecline] = useState<number>(15); // -15% decline
  const [bearOpexIncrease, setBearOpexIncrease] = useState<number>(8); // +8% opex increase

  // Sensitivity Lever
  const [revenueSensitivity, setRevenueSensitivity] = useState<number>(0); // manual adjustments

  // Helper to sum monthly values
  const calculateTotal = (mv: any) => {
    if (!mv) return 0;
    return Object.values(mv as Record<string, number>).reduce((a, b) => a + b, 0);
  };

  // Base values from snapshots
  const baseRevenue = calculateTotal(pnlSnapshot?.summary.grossRevenue);
  const baseCogs = calculateTotal(pnlSnapshot?.summary.cogs);
  const baseOpex = calculateTotal(pnlSnapshot?.summary.operatingExpenses);
  const baseDepreciation = calculateTotal(pnlSnapshot?.summary.depreciation);
  const baseInterest = calculateTotal(pnlSnapshot?.summary.interestExpense);
  const baseTax = calculateTotal(pnlSnapshot?.summary.incomeTax);
  const baseNetIncome = calculateTotal(pnlSnapshot?.summary.netIncome);
  const baseClosingCash = cashFlowSnapshot ? Object.values(cashFlowSnapshot.closingCash)[11] : 0;

  // Bull Case Calculations
  const bullRevenue = Math.round(baseRevenue * (1 + bullRevGrowth / 100));
  const bullCogs = Math.round(baseCogs * (1 - bullOpexSaving / 100)); // assume COGS scales down with OPEX efficiency
  const bullOpex = Math.round(baseOpex * (1 - bullOpexSaving / 100));
  const bullEbitda = bullRevenue - bullCogs - bullOpex;
  const bullEbit = bullEbitda - baseDepreciation;
  const bullEbt = bullEbit - baseInterest;
  const taxRate = activeCycle?.macroAssumptions.taxRate ? activeCycle.macroAssumptions.taxRate / 100 : 0.22;
  const bullTax = Math.round(Math.max(0, bullEbt) * taxRate);
  const bullNetIncome = bullEbt - bullTax;
  const bullClosingCash = baseClosingCash + (bullNetIncome - baseNetIncome);

  // Bear Case Calculations
  const bearRevenue = Math.round(baseRevenue * (1 - bearRevDecline / 100));
  const bearCogs = Math.round(baseCogs * (1 + bearOpexIncrease / 100));
  const bearOpex = Math.round(baseOpex * (1 + bearOpexIncrease / 100));
  const bearEbitda = bearRevenue - bearCogs - bearOpex;
  const bearEbit = bearEbitda - baseDepreciation;
  const bearEbt = bearEbit - baseInterest;
  const bearTax = Math.round(Math.max(0, bearEbt) * taxRate);
  const bearNetIncome = bearEbt - bearTax;
  const bearClosingCash = baseClosingCash + (bearNetIncome - baseNetIncome);

  // Sensitivity impact calculations
  const sensitivityRevenue = Math.round(baseRevenue * (1 + revenueSensitivity / 100));
  const sensitivityNetIncome = Math.round((sensitivityRevenue - baseCogs - baseOpex - baseDepreciation - baseInterest) * (1 - taxRate));
  const sensitivityDiff = sensitivityNetIncome - baseNetIncome;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatPercent = (val: number) => {
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  // Chart data setup
  const chartData = [
    // Base Case
    { scenario: 'Base Case', metric: 'Pendapatan', value: baseRevenue },
    { scenario: 'Base Case', metric: 'OPEX', value: baseOpex },
    { scenario: 'Base Case', metric: 'Laba Bersih', value: baseNetIncome },
    { scenario: 'Base Case', metric: 'Kas Akhir', value: baseClosingCash },

    // Bull Case
    { scenario: 'Bull Case', metric: 'Pendapatan', value: bullRevenue },
    { scenario: 'Bull Case', metric: 'OPEX', value: bullOpex },
    { scenario: 'Bull Case', metric: 'Laba Bersih', value: bullNetIncome },
    { scenario: 'Bull Case', metric: 'Kas Akhir', value: bullClosingCash },

    // Bear Case
    { scenario: 'Bear Case', metric: 'Pendapatan', value: bearRevenue },
    { scenario: 'Bear Case', metric: 'OPEX', value: bearOpex },
    { scenario: 'Bear Case', metric: 'Laba Bersih', value: bearNetIncome },
    { scenario: 'Bear Case', metric: 'Kas Akhir', value: bearClosingCash },
  ];

  const chartConfig = {
    data: chartData,
    xField: 'metric',
    yField: 'value',
    colorField: 'scenario',
    group: true,
    scale: {
      color: {
        range: ['#3B82F6', '#10B981', '#EF4444'], // Blue, Green, Red
      },
    },
    tooltip: {
      valueFormatter: (v: number) => formatCurrency(v),
    },
  };

  const columns = [
    {
      title: 'Metrik Keuangan (Tahunan)',
      dataIndex: 'metric',
      key: 'metric',
      render: (text: string) => <Text strong style={{ color: '#fff' }}>{text}</Text>
    },
    {
      title: 'Base Case',
      dataIndex: 'base',
      key: 'base',
      className: 'font-mono',
      render: (val: number) => formatCurrency(val)
    },
    {
      title: 'Bull Case',
      dataIndex: 'bull',
      key: 'bull',
      className: 'font-mono',
      render: (val: number, record: any) => {
        const pct = ((val - record.base) / record.base) * 100;
        return (
          <div>
            <div>{formatCurrency(val)}</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981' }}>{formatPercent(pct)}</div>
          </div>
        );
      }
    },
    {
      title: 'Bear Case',
      dataIndex: 'bear',
      key: 'bear',
      className: 'font-mono',
      render: (val: number, record: any) => {
        const pct = ((val - record.base) / record.base) * 100;
        return (
          <div>
            <div>{formatCurrency(val)}</div>
            <div style={{ fontSize: '0.75rem', color: '#EF4444' }}>{formatPercent(pct)}</div>
          </div>
        );
      }
    }
  ];

  const dataSource = [
    { key: '1', metric: 'Total Pendapatan', base: baseRevenue, bull: bullRevenue, bear: bearRevenue },
    { key: '2', metric: 'Harga Pokok Penjualan (COGS)', base: baseCogs, bull: bullCogs, bear: bearCogs },
    { key: '3', metric: 'Biaya Operasional (OPEX)', base: baseOpex, bull: bullOpex, bear: bearOpex },
    { key: '4', metric: 'Proyeksi Laba Bersih', base: baseNetIncome, bull: bullNetIncome, bear: bearNetIncome },
    { key: '5', metric: 'Kas Akhir Tahun', base: baseClosingCash, bull: bullClosingCash, bear: bearClosingCash },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#fff' }}>Analisis Skenario & Sensitivitas</Title>
        <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.45)' }}>
          Uji ketahanan finansial perusahaan dengan mensimulasikan skenario Bull/Bear dan menganalisis sensitivitas laba bersih.
        </Paragraph>
      </div>

      {/* Control Levers Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title={<span style={{ color: '#10B981' }}>Levers Optimis (Bull Case)</span>}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Kenaikan Pendapatan</Text>
                <Text strong style={{ color: '#10B981' }}>+{bullRevGrowth}%</Text>
              </div>
              <Slider
                min={0}
                max={30}
                value={bullRevGrowth}
                onChange={setBullRevGrowth}
                tooltip={{ formatter: (v) => v !== undefined ? `+${v}%` : '' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Efisiensi OPEX / COGS</Text>
                <Text strong style={{ color: '#10B981' }}>-{bullOpexSaving}%</Text>
              </div>
              <Slider
                min={0}
                max={20}
                value={bullOpexSaving}
                onChange={setBullOpexSaving}
                tooltip={{ formatter: (v) => v !== undefined ? `-${v}%` : '' }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={<span style={{ color: '#EF4444' }}>Levers Pesimis (Bear Case)</span>}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Penurunan Pendapatan</Text>
                <Text strong style={{ color: '#EF4444' }}>-{bearRevDecline}%</Text>
              </div>
              <Slider
                min={0}
                max={40}
                value={bearRevDecline}
                onChange={setBearRevDecline}
                tooltip={{ formatter: (v) => v !== undefined ? `-${v}%` : '' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Peningkatan OPEX / COGS</Text>
                <Text strong style={{ color: '#EF4444' }}>+{bearOpexIncrease}%</Text>
              </div>
              <Slider
                min={0}
                max={25}
                value={bearOpexIncrease}
                onChange={setBearOpexIncrease}
                tooltip={{ formatter: (v) => v !== undefined ? `+${v}%` : '' }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Comparison Table & Chart */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={{ color: '#fff' }}>Tabel Perbandingan Skenario (RKAP {activeCycle?.fiscalYear})</span>}>
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<span style={{ color: '#fff' }}>Visualisasi Perbandingan Metrik Finansial</span>} style={{ height: '100%' }}>
            <div style={{ height: 320 }}>
              <Column {...chartConfig} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Sensitivity Simulator Card */}
      <Card title={<span style={{ color: '#fff' }}>Simulator Sensitivitas Laba Bersih</span>}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
              Gunakan simulator ini untuk melihat dampak langsung dari perubahan presentase <strong>Pendapatan Usaha</strong> terhadap laba bersih tahunan perusahaan.
            </Paragraph>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Ubah Target Pendapatan</Text>
              <Text strong style={{ color: revenueSensitivity >= 0 ? '#10B981' : '#EF4444', fontSize: '1.1rem' }}>
                {revenueSensitivity >= 0 ? '+' : ''}{revenueSensitivity}%
              </Text>
            </div>
            <Slider
              min={-30}
              max={30}
              value={revenueSensitivity}
              onChange={setRevenueSensitivity}
              tooltip={{ formatter: (v) => v !== undefined ? `${v > 0 ? '+' : ''}${v}%` : '' }}
            />
          </Col>

          <Col xs={24} md={12}>
            <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>Proyeksi Laba Bersih</span>}
                value={sensitivityNetIncome}
                formatter={(v) => <span className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>{formatCurrency(Number(v))}</span>}
              />
              <Divider type="vertical" style={{ height: 50, borderColor: 'rgba(255,255,255,0.08)' }} />
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>Dampak Finansial (Vs Base)</span>}
                value={sensitivityDiff}
                formatter={(v) => (
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: Number(v) >= 0 ? '#10B981' : '#EF4444'
                    }}
                  >
                    {Number(v) >= 0 ? '+' : ''}{formatCurrency(Number(v))}
                  </span>
                )}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
