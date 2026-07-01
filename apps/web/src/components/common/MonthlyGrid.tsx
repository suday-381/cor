import React, { useState, useEffect } from 'react';
import { Row, Col, Button, InputNumber, Space, Typography, Tooltip, Divider } from 'antd';
import { CopyOutlined, SplitCellsOutlined, ClearOutlined } from '@ant-design/icons';
import { MonthlyValues, MONTH_KEYS, MONTH_LABELS } from '@/types';

const { Text } = Typography;

interface MonthlyGridProps {
  value: MonthlyValues;
  onChange: (newValue: MonthlyValues) => void;
  disabled?: boolean;
}

export const MonthlyGrid: React.FC<MonthlyGridProps> = ({ value, onChange, disabled = false }) => {
  const [localValues, setLocalValues] = useState<MonthlyValues>(value);
  const [distributeVal, setDistributeVal] = useState<number | null>(null);

  useEffect(() => {
    setLocalValues(value);
  }, [value]);

  const handleCellChange = (month: keyof MonthlyValues, val: number | null) => {
    const newVal = val || 0;
    const updated = { ...localValues, [month]: newVal };
    setLocalValues(updated);
    onChange(updated);
  };

  const handleCopyJanToAll = () => {
    const janVal = localValues.jan;
    const updated = {
      jan: janVal, feb: janVal, mar: janVal, apr: janVal,
      may: janVal, jun: janVal, jul: janVal, aug: janVal,
      sep: janVal, oct: janVal, nov: janVal, dec: janVal,
    };
    setLocalValues(updated);
    onChange(updated);
  };

  const handleDistributeEqually = () => {
    if (distributeVal === null || distributeVal <= 0) return;
    const share = Math.round(distributeVal / 12);
    // adjust last month for rounding errors
    const lastMonthShare = distributeVal - (share * 11);
    const updated = {
      jan: share, feb: share, mar: share, apr: share,
      may: share, jun: share, jul: share, aug: share,
      sep: share, oct: share, nov: share, dec: lastMonthShare,
    };
    setLocalValues(updated);
    onChange(updated);
    setDistributeVal(null);
  };

  const handleClear = () => {
    const updated = {
      jan: 0, feb: 0, mar: 0, apr: 0,
      may: 0, jun: 0, jul: 0, aug: 0,
      sep: 0, oct: 0, nov: 0, dec: 0,
    };
    setLocalValues(updated);
    onChange(updated);
  };

  const calculateTotal = () => {
    return Object.values(localValues).reduce((a, b) => a + b, 0);
  };

  const calculateAverage = () => {
    return Math.round(calculateTotal() / 12);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div style={{
      padding: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 8,
    }}>
      {/* Quick Tools */}
      {!disabled && (
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>Alat Bantu Distribusi Anggaran:</Text>
          </Col>
          <Col>
            <Space>
              <Tooltip title="Salin nilai Januari ke semua bulan">
                <Button
                  size="small"
                  type="dashed"
                  icon={<CopyOutlined />}
                  onClick={handleCopyJanToAll}
                >
                  Salin Jan
                </Button>
              </Tooltip>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <InputNumber
                  size="small"
                  placeholder="Total Anggaran..."
                  style={{ width: 140 }}
                  value={distributeVal}
                  onChange={setDistributeVal}
                  formatter={value => value ? `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                  parser={value => value ? Number(value.replace(/\Rp\s?|(\.)/g, '')) : 0}
                />
                <Button
                  size="small"
                  type="primary"
                  icon={<SplitCellsOutlined />}
                  disabled={!distributeVal}
                  onClick={handleDistributeEqually}
                >
                  Bagi Rata
                </Button>
              </div>

              <Button
                size="small"
                danger
                type="text"
                icon={<ClearOutlined />}
                onClick={handleClear}
              >
                Clear
              </Button>
            </Space>
          </Col>
        </Row>
      )}

      {/* Grid Inputs */}
      <Row gutter={[12, 12]}>
        {MONTH_KEYS.map((key, index) => (
          <Col xs={12} sm={8} md={6} lg={4} xl={2} key={key}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600, textAlign: 'center' }}>
                {MONTH_LABELS[index]}
              </Text>
              <InputNumber
                disabled={disabled}
                value={localValues[key]}
                onChange={(val) => handleCellChange(key, val)}
                style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}
                formatter={val => val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0'}
                parser={val => val ? Number(val.replace(/\./g, '')) : 0}
              />
            </div>
          </Col>
        ))}
      </Row>

      <Divider style={{ margin: '16px 0', borderColor: 'rgba(255, 255, 255, 0.06)' }} />

      {/* Totals Summary */}
      <Row justify="end" gutter={24}>
        <Col>
          <Space direction="vertical" align="end" size={0}>
            <Text type="secondary" style={{ fontSize: '0.78rem' }}>RATA-RATA BULANAN</Text>
            <Text strong className="font-mono" style={{ fontSize: '1.05rem', color: '#10B981' }}>
              {formatCurrency(calculateAverage())}
            </Text>
          </Space>
        </Col>
        <Col style={{ paddingRight: 16 }}>
          <Space direction="vertical" align="end" size={0}>
            <Text type="secondary" style={{ fontSize: '0.78rem' }}>TOTAL TAHUNAN</Text>
            <Text strong className="font-mono" style={{ fontSize: '1.25rem', color: '#10B981' }}>
              {formatCurrency(calculateTotal())}
            </Text>
          </Space>
        </Col>
      </Row>
    </div>
  );
};


