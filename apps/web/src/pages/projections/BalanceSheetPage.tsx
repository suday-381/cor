import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Statistic, Alert, Tag, Tooltip, Button, Form, InputNumber, Divider, Modal, Select, Space } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { FinancialTable, FinancialRow } from '@/components/common/FinancialTable';
import { api } from '@/utils/api';
import { BalanceSheetSnapshot } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const BalanceSheetPage: React.FC = () => {
  const { selectedCycleId, cycles, updateMacroAssumptions, currentUser, departments } = useAppStore();
  const [selectedDivId, setSelectedDivId] = useState<string>('all');
  const [bsData, setBsData] = useState<BalanceSheetSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [divisionList, setDivisionList] = useState<any[]>([]);

  const [isPrevBsOpen, setIsPrevBsOpen] = useState(false);
  const [prevBsForm] = Form.useForm();

  const defaultPrevBs = {
    cashAndEquivalents: 5000000000,
    accountsReceivable: 3000000000,
    inventory: 2000000000,
    prepaidExpenses: 500000000,
    fixedAssets: 15000000000,
    accumulatedDepreciation: 3000000000,
    longTermInvestments: 1000000000,
    otherAssets: 500000000,
    accountsPayable: 2500000000,
    taxPayable: 500000000,
    accruedExpenses: 500000000,
    shortTermDebt: 1000000000,
    longTermDebt: 5000000000,
    bonds: 2000000000,
    employeeBenefits: 1000000000,
    shareCapital: 7000000000,
    retainedEarnings: 3500000000,
    reserves: 1000000000,
  };

  const userDept = departments.find(d => d.id === currentUser?.departmentId);
  const userDivId = userDept ? (userDept.parentId || userDept.id) : '';
  const isGlobalUser = ['super_admin', 'csp', 'cfo'].includes(currentUser?.role || '');

  // Load divisions list
  useEffect(() => {
    if (selectedCycleId) {
      api.get<any[]>('/workflow/divisions', { cycleId: selectedCycleId })
        .then(res => setDivisionList(res))
        .catch(err => console.error(err));
    }
  }, [selectedCycleId]);

  // Load Balance Sheet data dynamically
  const fetchBalanceSheet = () => {
    if (selectedCycleId && departments.length > 0) {
      setLoading(true);
      const activeDivId = isGlobalUser ? selectedDivId : userDivId;
      api.get<BalanceSheetSnapshot>('/projections/balancesheet', {
        cycleId: selectedCycleId,
        divisionId: activeDivId === 'all' ? undefined : activeDivId
      })
      .then(res => {
        setBsData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setBsData(null);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [selectedCycleId, selectedDivId, currentUser, departments, isGlobalUser, userDivId]);

  // Sync defaults
  useEffect(() => {
    if (!isGlobalUser && userDivId) {
      setSelectedDivId(userDivId);
    } else if (isGlobalUser) {
      setSelectedDivId('all');
    }
  }, [isGlobalUser, userDivId]);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);

  useEffect(() => {
    if (activeCycle) {
      prevBsForm.setFieldsValue(activeCycle.macroAssumptions.previousBalanceSheet || defaultPrevBs);
    }
  }, [activeCycle, isPrevBsOpen, prevBsForm]);

  const handleApplyPrevBs = async (values: any) => {
    if (activeCycle) {
      await updateMacroAssumptions(activeCycle.id, {
        previousBalanceSheet: values,
      });
      fetchBalanceSheet();
      setIsPrevBsOpen(false);
    }
  };

  const getBalanceSheetRows = (): FinancialRow[] => {
    if (!bsData) return [];

    const ca = bsData.currentAssets;
    const nca = bsData.nonCurrentAssets;
    const cl = bsData.currentLiabilities;
    const ltl = bsData.longTermLiabilities;
    const eq = bsData.equity;

    return [
      {
        key: 'assets-header',
        name: 'ASET',
        isHeader: true,
        values: bsData.totalAssets
      },
      {
        key: 'current-assets-header',
        name: 'ASET LANCAR',
        isHeader: true,
        values: ca.totalCurrentAssets
      },
      {
        key: 'cash-eq',
        name: 'Kas & Setara Kas',
        indent: 1,
        tooltip: 'Saldo Kas akhir periode (ditransfer dari Laporan Arus Kas)',
        values: ca.cashAndEquivalents
      },
      {
        key: 'ar-bs',
        name: 'Piutang Usaha',
        indent: 1,
        tooltip: 'Piutang dagang terutang dari pelanggan',
        values: ca.accountsReceivable
      },
      {
        key: 'inv-bs',
        name: 'Persediaan',
        indent: 1,
        tooltip: 'Nilai persediaan bahan baku dan barang jadi',
        values: ca.inventory
      },
      {
        key: 'prepaid',
        name: 'Beban Dibayar di Muka (Prepaid)',
        indent: 1,
        values: ca.prepaidExpenses
      },
      {
        key: 'total-ca',
        name: 'Total Aset Lancar',
        isSubtotal: true,
        values: ca.totalCurrentAssets
      },

      {
        key: 'non-current-assets-header',
        name: 'ASET TIDAK LANCAR',
        isHeader: true,
        values: nca.totalNonCurrentAssets
      },
      {
        key: 'fixed-assets',
        name: 'Aset Tetap (Peralatan, Gedung, dll)',
        indent: 1,
        tooltip: 'Nilai buku kotor dari aset fisik perusahaan',
        values: nca.fixedAssets
      },
      {
        key: 'accum-dep',
        name: 'Akumulasi Penyusutan',
        indent: 1,
        tooltip: 'Akumulasi beban depresiasi bulanan (nilai negatif)',
        values: Object.fromEntries(
          Object.entries(nca.accumulatedDepreciation || {}).map(([k, v]) => [k, -v])
        ) as any
      },
      {
        key: 'net-fa',
        name: 'Aset Tetap Bersih',
        indent: 1,
        values: nca.netFixedAssets
      },
      {
        key: 'lt-invest',
        name: 'Investasi Jangka Panjang',
        indent: 1,
        values: nca.longTermInvestments
      },
      {
        key: 'other-assets',
        name: 'Aset Lain-lain',
        indent: 1,
        values: nca.otherAssets
      },
      {
        key: 'total-nca',
        name: 'Total Aset Tidak Lancar',
        isSubtotal: true,
        values: nca.totalNonCurrentAssets
      },
      {
        key: 'total-assets',
        name: 'TOTAL ASET',
        isTotal: true,
        values: bsData.totalAssets
      },

      // === LIABILITAS ===
      {
        key: 'liabilities-header',
        name: 'LIABILITAS',
        isHeader: true,
        values: bsData.totalLiabilities
      },
      {
        key: 'current-liabilities-header',
        name: 'LIABILITAS JANGKA PENDEK',
        isHeader: true,
        values: cl.totalCurrentLiabilities
      },
      {
        key: 'ap-bs',
        name: 'Utang Usaha',
        indent: 1,
        tooltip: 'Utang pembelian bahan baku/jasa ke pemasok',
        values: cl.accountsPayable
      },
      {
        key: 'tax-pay',
        name: 'Utang Pajak (PPh)',
        indent: 1,
        values: cl.taxPayable
      },
      {
        key: 'accrued-exp',
        name: 'Beban Akrual / Masih Harus Dibayar',
        indent: 1,
        values: cl.accruedExpenses
      },
      {
        key: 'st-debt',
        name: 'Utang Jangka Pendek',
        indent: 1,
        values: cl.shortTermDebt
      },
      {
        key: 'total-cl',
        name: 'Total Liabilitas Jangka Pendek',
        isSubtotal: true,
        values: cl.totalCurrentLiabilities
      },

      {
        key: 'long-term-liabilities-header',
        name: 'LIABILITAS JANGKA PANJANG',
        isHeader: true,
        values: ltl.totalLongTermLiabilities
      },
      {
        key: 'lt-debt',
        name: 'Utang Bank Jangka Panjang',
        indent: 1,
        tooltip: 'Utang jangka panjang outstanding dikurangi cicilan tahun berjalan',
        values: ltl.longTermDebt
      },
      {
        key: 'bonds',
        name: 'Obligasi / Surat Utang Jangka Panjang',
        indent: 1,
        values: ltl.bonds
      },
      {
        key: 'emp-benefits',
        name: 'Liabilitas Imbalan Kerja',
        indent: 1,
        values: ltl.employeeBenefits
      },
      {
        key: 'total-ltl',
        name: 'Total Liabilitas Jangka Panjang',
        isSubtotal: true,
        values: ltl.totalLongTermLiabilities
      },
      {
        key: 'total-liabilities',
        name: 'TOTAL LIABILITAS',
        isSubtotal: true,
        values: bsData.totalLiabilities
      },

      // === EKUITAS ===
      {
        key: 'equity-header',
        name: 'EKUITAS',
        isHeader: true,
        values: eq.totalEquity
      },
      {
        key: 'share-cap',
        name: 'Modal Saham',
        indent: 1,
        values: eq.shareCapital
      },
      {
        key: 'retained-earning',
        name: 'Laba Ditahan (Retained Earnings)',
        indent: 1,
        tooltip: 'Akumulasi laba bersih disetorkan dikurangi dividen dibagikan',
        values: eq.retainedEarnings
      },
      {
        key: 'reserves',
        name: 'Cadangan Ekuitas',
        indent: 1,
        values: eq.reserves
      },
      {
        key: 'total-eq',
        name: 'Total Ekuitas',
        isSubtotal: true,
        values: eq.totalEquity
      },

      {
        key: 'total-le',
        name: 'TOTAL LIABILITAS DAN EKUITAS',
        isTotal: true,
        values: bsData.totalLiabilitiesAndEquity
      }
    ];
  };

  const isBalanced = bsData?.isBalanced ?? true;
  const ratio = bsData?.financialRatios;

  // Grab Dec values for card statistics
  const currentRatioDec = ratio ? Object.values(ratio.currentRatio)[11] : 0;
  const deRatioDec = ratio ? Object.values(ratio.debtToEquity)[11] : 0;
  const roeDec = ratio ? Object.values(ratio.roe)[11] : 0;
  const roaDec = ratio ? Object.values(ratio.roa)[11] : 0;

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
                <Text style={{ color: isApproved ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
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
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Proyeksi Neraca (Balance Sheet)</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Tinjau proyeksi posisi keuangan (Aset, Liabilitas, Ekuitas) divisi.
          </Paragraph>
        </div>
        <Space align="center" size={16}>
          <span style={{ color: '#9CA3AF' }}>Filter Divisi:</span>
          <Select
            value={isGlobalUser ? selectedDivId : userDivId}
            onChange={setSelectedDivId}
            disabled={!isGlobalUser}
            style={{ width: 280 }}
            dropdownStyle={{ backgroundColor: '#111827' }}
            options={divOptions}
          />
          {isGlobalUser && (
            <Button
              type="default"
              icon={<SettingOutlined />}
              onClick={() => setIsPrevBsOpen(true)}
            >
              Neraca Tahun Sebelumnya
            </Button>
          )}
          {isBalanced ? (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: '0.95rem', padding: '6px 12px', borderRadius: 8 }}>
              Neraca Seimbang (Balanced)
            </Tag>
          ) : (
            <Tag color="error" icon={<ExclamationCircleOutlined />} style={{ fontSize: '0.95rem', padding: '6px 12px', borderRadius: 8 }}>
              Neraca Tidak Seimbang!
            </Tag>
          )}
        </Space>
      </div>

      {renderChecklist()}

      {!isBalanced && (
        <Alert
          message="Selisih Akuntansi Terdeteksi"
          description="Terdapat selisih antara nilai Total Aset dan Total Liabilitas + Ekuitas pada salah satu periode bulanan. Mohon tinjau keselarasan nilai depresiasi, piutang, dan penutupan kas."
          type="warning"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {/* Ratios row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>CURRENT RATIO (DESEMBER)</span>
                  <Tooltip title="Aset Lancar / Liabilitas Jangka Pendek"><InfoCircleOutlined style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} /></Tooltip>
                </div>
              }
              value={currentRatioDec}
              precision={2}
              suffix="x"
              formatter={v => <span className="font-mono text-positive" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{v}x</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>DEBT-TO-EQUITY RATIO (DESEMBER)</span>
                  <Tooltip title="Total Liabilitas / Total Ekuitas"><InfoCircleOutlined style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} /></Tooltip>
                </div>
              }
              value={deRatioDec}
              precision={2}
              suffix="x"
              formatter={v => <span className="font-mono text-warning" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{v}x</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>RETURN ON EQUITY (ROE)</span>
                  <Tooltip title="Laba Bersih Tahunan / Total Ekuitas"><InfoCircleOutlined style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} /></Tooltip>
                </div>
              }
              value={roeDec}
              precision={1}
              suffix="%"
              formatter={v => <span className="font-mono text-positive" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{v}%</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>RETURN ON ASSETS (ROA)</span>
                  <Tooltip title="Laba Bersih Tahunan / Total Aset"><InfoCircleOutlined style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} /></Tooltip>
                </div>
              }
              value={roaDec}
              precision={1}
              suffix="%"
              formatter={v => <span className="font-mono text-positive" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{v}%</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Balance Sheet Table */}
      <FinancialTable
        title={`Proyeksi Neraca — RKAP ${activeCycle?.fiscalYear}`}
        rows={getBalanceSheetRows()}
        loading={loading}
      />

      {/* PREVIOUS YEAR BALANCE SHEET MODAL */}
      <Modal
        title="Posisi Neraca Awal (Tahun Sebelumnya)"
        open={isPrevBsOpen}
        onCancel={() => setIsPrevBsOpen(false)}
        onOk={() => prevBsForm.submit()}
        okText="Simpan & Hitung Ulang"
        cancelText="Batal"
        width={700}
      >
        <Form
          form={prevBsForm}
          onFinish={handleApplyPrevBs}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)' }}>
            Masukkan data neraca penutupan audit dari tahun anggaran sebelumnya. Angka-angka ini akan menjadi saldo awal aset, liabilitas, dan ekuitas di tahun berjalan.
          </Paragraph>

          <Row gutter={24}>
            <Col span={12}>
              <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>Aset (Assets)</Divider>
              
              <Form.Item name="cashAndEquivalents" label="Kas & Setara Kas" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>
              
              <Form.Item name="accountsReceivable" label="Piutang Usaha" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="inventory" label="Persediaan Barang" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="prepaidExpenses" label="Beban Dibayar di Muka" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="fixedAssets" label="Aset Tetap (Peralatan/Gedung)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="accumulatedDepreciation" label="Akumulasi Penyusutan (Positif)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="longTermInvestments" label="Investasi Jangka Panjang" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="otherAssets" label="Aset Lain-lain" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>Liabilitas (Liabilities)</Divider>

              <Form.Item name="accountsPayable" label="Utang Usaha" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="taxPayable" label="Utang Pajak PPh" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="accruedExpenses" label="Biaya Masih Harus Dibayar" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="shortTermDebt" label="Utang Bank Jangka Pendek" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="longTermDebt" label="Utang Bank Jangka Panjang" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="bonds" label="Obligasi / Surat Utang" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="employeeBenefits" label="Liabilitas Imbalan Kerja" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>Ekuitas (Equity)</Divider>

              <Form.Item name="shareCapital" label="Modal Saham Disetor" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="retainedEarnings" label="Laba Ditahan" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>

              <Form.Item name="reserves" label="Cadangan Ekuitas" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
