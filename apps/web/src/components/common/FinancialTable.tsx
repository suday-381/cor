import React, { useState } from 'react';
import { Radio, Space, Typography, Tooltip, Table, Input } from 'antd';
import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { MonthlyValues, MONTH_KEYS, MONTH_LABELS } from '@/types';

const { Text } = Typography;

export interface FinancialRow {
  key: string;
  name: string;
  isHeader?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  indent?: number;
  tooltip?: string;
  values: MonthlyValues;
}

interface FinancialTableProps {
  title: string;
  rows: FinancialRow[];
  loading?: boolean;
}

type ViewMode = 'monthly' | 'quarterly' | 'annual';

export const FinancialTable: React.FC<FinancialTableProps> = ({ title, rows, loading = false }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [searchText, setSearchText] = useState<string>('');

  const formatCurrency = (val: number) => {
    if (val === 0) return '-';
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(Math.abs(val));

    return val < 0 ? `(${formatted})` : formatted;
  };

  // Aggregation helpers
  const getQuarterlyValues = (mv: MonthlyValues) => {
    const q1 = mv.jan + mv.feb + mv.mar;
    const q2 = mv.apr + mv.may + mv.jun;
    const q3 = mv.jul + mv.aug + mv.sep;
    const q4 = mv.oct + mv.nov + mv.dec;
    return { q1, q2, q3, q4, total: q1 + q2 + q3 + q4 };
  };

  const getAnnualValues = (mv: MonthlyValues) => {
    return Object.values(mv).reduce((a, b) => a + b, 0);
  };

  // Columns definition based on viewMode
  const getColumns = () => {
    const baseColumns = [
      {
        title: 'Akun / Deskripsi',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left' as const,
        width: 250,
        render: (text: string, record: FinancialRow) => {
          let style: React.CSSProperties = {
            paddingLeft: record.indent ? record.indent * 16 : 0,
            fontWeight: record.isHeader || record.isTotal || record.isSubtotal ? 'bold' : 'normal',
          };

          if (record.isHeader) {
            style.color = '#10B981';
            style.fontSize = '0.9rem';
          }

          return (
            <Space size={6} style={style}>
              <span>{text}</span>
              {record.tooltip && (
                <Tooltip title={record.tooltip}>
                  <InfoCircleOutlined style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }} />
                </Tooltip>
              )}
            </Space>
          );
        }
      }
    ];

    if (viewMode === 'monthly') {
      const monthColumns = MONTH_KEYS.map((key, index) => ({
        title: MONTH_LABELS[index],
        dataIndex: ['values', key],
        key,
        align: 'right' as const,
        width: 110,
        render: (value: number, record: FinancialRow) => {
          if (record.isHeader) return '';
          const isNegative = value < 0;
          let className = 'font-mono ';
          if (isNegative) className += 'text-negative';
          return <span className={className}>{formatCurrency(value)}</span>;
        }
      }));

      const totalColumn = {
        title: 'TOTAL TAHUNAN',
        key: 'total',
        align: 'right' as const,
        width: 140,
        fixed: 'right' as const,
        render: (_: any, record: FinancialRow) => {
          if (record.isHeader) return '';
          const totalVal = getAnnualValues(record.values);
          const isNegative = totalVal < 0;
          let className = 'font-mono ';
          if (record.isTotal || record.isSubtotal) className += 'font-bold ';
          if (isNegative) className += 'text-negative';
          else if (record.isTotal) className += 'text-positive';
          return <span className={className}>{formatCurrency(totalVal)}</span>;
        }
      };

      return [...baseColumns, ...monthColumns, totalColumn];
    }

    if (viewMode === 'quarterly') {
      const quarters = ['Kuartal 1', 'Kuartal 2', 'Kuartal 3', 'Kuartal 4'];
      const qKeys = ['q1', 'q2', 'q3', 'q4'] as const;

      const qColumns = qKeys.map((key, index) => ({
        title: quarters[index],
        key,
        align: 'right' as const,
        width: 140,
        render: (_: any, record: FinancialRow) => {
          if (record.isHeader) return '';
          const qVal = getQuarterlyValues(record.values)[key];
          const isNegative = qVal < 0;
          let className = 'font-mono ';
          if (isNegative) className += 'text-negative';
          return <span className={className}>{formatCurrency(qVal)}</span>;
        }
      }));

      const totalColumn = {
        title: 'TOTAL TAHUNAN',
        key: 'total',
        align: 'right' as const,
        width: 150,
        fixed: 'right' as const,
        render: (_: any, record: FinancialRow) => {
          if (record.isHeader) return '';
          const totalVal = getAnnualValues(record.values);
          const isNegative = totalVal < 0;
          let className = 'font-mono ';
          if (record.isTotal || record.isSubtotal) className += 'font-bold ';
          if (isNegative) className += 'text-negative';
          else if (record.isTotal) className += 'text-positive';
          return <span className={className}>{formatCurrency(totalVal)}</span>;
        }
      };

      return [...baseColumns, ...qColumns, totalColumn];
    }

    // Annual mode (just show description and the annual total)
    return [
      baseColumns[0],
      {
        title: 'TOTAL ANGGARAN TAHUNAN',
        key: 'total_annual',
        align: 'right' as const,
        render: (_: any, record: FinancialRow) => {
          if (record.isHeader) return '';
          const totalVal = getAnnualValues(record.values);
          const isNegative = totalVal < 0;
          let className = 'font-mono ';
          if (record.isTotal || record.isSubtotal) className += 'font-bold ';
          if (isNegative) className += 'text-negative';
          else if (record.isTotal) className += 'text-positive';
          return <span style={{ fontSize: '1.05rem' }} className={className}>{formatCurrency(totalVal)}</span>;
        }
      }
    ];
  };

  const filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getRowClassName = (record: FinancialRow) => {
    if (record.isHeader) return 'section-header';
    if (record.isTotal) return 'total';
    if (record.isSubtotal) return 'subtotal';
    return '';
  };

  return (
    <div style={{ backgroundColor: '#111827', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Text strong style={{ fontSize: '1.25rem', color: '#fff' }}>{title}</Text>
        <Space size={16} style={{ flexWrap: 'wrap' }}>
          <Input
            placeholder="Cari akun..."
            prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
            size="small"
          />
          <Radio.Group
            value={viewMode}
            onChange={e => setViewMode(e.target.value)}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button value="monthly">Bulanan</Radio.Button>
            <Radio.Button value="quarterly">Kuartalan</Radio.Button>
            <Radio.Button value="annual">Tahunan</Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      <Table
        dataSource={filteredRows}
        columns={getColumns()}
        loading={loading}
        pagination={false}
        scroll={{ x: viewMode === 'monthly' ? 1400 : undefined }}
        rowClassName={getRowClassName}
        size="small"
        bordered
        style={{
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
};
