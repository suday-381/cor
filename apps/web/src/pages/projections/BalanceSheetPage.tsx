import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Statistic, Alert, Tag, Tooltip, Button, Form, InputNumber, Divider, Modal } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { FinancialTable, FinancialRow } from '@/components/common/FinancialTable';

const { Title, Text, Paragraph } = Typography;

export const BalanceSheetPage: React.FC = () => {
  const { selectedCycleId, balanceSheetSnapshot, recalculateAll, cycles, updateMacroAssumptions } = useAppStore();
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

  const activeCycle = cycles.find(c => c.id === selectedCycleId);

  useEffect(() => {
    recalculateAll();
  }, [selectedCycleId]);

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
      await recalculateAll();
      setIsPrevBsOpen(false);
    }
  };

  const getBalanceSheetRows = (): FinancialRow[] => {
    if (!balanceSheetSnapshot) return [];

    const ca = balanceSheetSnapshot.currentAssets;
    const nca = balanceSheetSnapshot.nonCurrentAssets;
    const cl = balanceSheetSnapshot.currentLiabilities;
    const ltl = balanceSheetSnapshot.longTermLiabilities;
    const eq = balanceSheetSnapshot.equity;

    return [
      // === ASET ===
      {
        key: 'assets-header',
        name: 'ASET',
        isHeader: true,
        values: balanceSheetSnapshot.totalAssets
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
          Object.entries(nca.accumulatedDepreciation).map(([k, v]) => [k, -v])
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
        values: balanceSheetSnapshot.totalAssets
      },

      // === LIABILITAS ===
      {
        key: 'liab-header',
        name: 'LIABILITAS & EKUITAS',
        isHeader: true,
        values: balanceSheetSnapshot.totalLiabilitiesAndEquity
      },
      {
        key: 'current-liab-header',
        name: 'LIABILITAS JANGKA PENDEK',
        isHeader: true,
        values: cl.totalCurrentLiabilities
      },
      {
        key: 'ap-bs',
        name: 'Utang Usaha',
        indent: 1,
        tooltip: 'Tagihan vendor terutang yang belum dibayar',
        values: cl.accountsPayable
      },
      {
        key: 'tax-pay',
        name: 'Utang Pajak',
        indent: 1,
        values: cl.taxPayable
      },
      {
        key: 'accrued-exp',
        name: 'Biaya Masih Harus Dibayar',
        indent: 1,
        values: cl.accruedExpenses
      },
      {
        key: 'st-debt',
        name: 'Utang Bank Jangka Pendek',
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
        key: 'long-term-liab-header',
        name: 'LIABILITAS JANGKA PANJANG',
        isHeader: true,
        values: ltl.totalLongTermLiabilities
      },
      {
        key: 'lt-debt',
        name: 'Utang Bank Jangka Panjang',
        indent: 1,
        values: ltl.longTermDebt
      },
      {
        key: 'bonds',
        name: 'Obligasi / Surat Utang',
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
        key: 'total-liab',
        name: 'Total Liabilitas',
        isSubtotal: true,
        values: balanceSheetSnapshot.totalLiabilities
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
        values: balanceSheetSnapshot.totalLiabilitiesAndEquity
      }
    ];
  };

  const isBalanced = balanceSheetSnapshot?.isBalanced ?? true;
  const ratio = balanceSheetSnapshot?.financialRatios;

  // Grab Dec values for card statistics
  const currentRatioDec = ratio ? Object.values(ratio.currentRatio)[11] : 0;
  const deRatioDec = ratio ? Object.values(ratio.debtToEquity)[11] : 0;
  const roeDec = ratio ? Object.values(ratio.roe)[11] : 0;
  const roaDec = ratio ? Object.values(ratio.roa)[11] : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Proyeksi Neraca (Balance Sheet)</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Tinjau proyeksi posisi keuangan (Aset, Liabilitas, Ekuitas). Formula otomatis memastikan persamaan dasar akuntansi tetap seimbang.
          </Paragraph>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Button
            type="default"
            icon={<SettingOutlined />}
            onClick={() => setIsPrevBsOpen(true)}
          >
            Neraca Tahun Sebelumnya
          </Button>
          {isBalanced ? (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: '1rem', padding: '6px 12px', borderRadius: 8 }}>
              Neraca Seimbang (Balanced)
            </Tag>
          ) : (
            <Tag color="error" icon={<ExclamationCircleOutlined />} style={{ fontSize: '1rem', padding: '6px 12px', borderRadius: 8 }}>
              Neraca Tidak Seimbang!
            </Tag>
          )}
        </div>
      </div>

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
            {/* ASET */}
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

            {/* LIABILITAS & EKUITAS */}
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
