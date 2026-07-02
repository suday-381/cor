import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Statistic, Alert, Form, InputNumber, Button, Space, Slider, Modal, Tooltip, Select, Divider, Tag } from 'antd';
import { InfoCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { FinancialTable, FinancialRow } from '@/components/common/FinancialTable';
import { formatCurrency } from '@/utils/format';
import { api } from '@/utils/api';
import { CashFlowProjection } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const CashFlowPage: React.FC = () => {
  const {
    selectedCycleId,
    cycles,
    updateMacroAssumptions,
    displayUnit,
    currentUser,
    departments,
  } = useAppStore();

  const [selectedDivId, setSelectedDivId] = useState<string>('all');
  const [cfData, setCfData] = useState<CashFlowProjection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [divisionList, setDivisionList] = useState<any[]>([]);

  const [isWcOpen, setIsWcOpen] = useState(false);
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);
  const [financingForm] = Form.useForm();
  const [begCashOption, setBegCashOption] = useState<'manual' | 'previous_year'>('manual');

  const [dso, setDso] = useState(45);
  const [dio, setDio] = useState(30);
  const [dpo, setDpo] = useState(35);

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

  // Load Cash Flow data dynamically
  const fetchCashFlow = () => {
    if (selectedCycleId && departments.length > 0) {
      setLoading(true);
      const activeDivId = isGlobalUser ? selectedDivId : userDivId;
      api.get<CashFlowProjection>('/projections/cashflow', {
        cycleId: selectedCycleId,
        divisionId: activeDivId === 'all' ? undefined : activeDivId
      })
      .then(res => {
        setCfData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setCfData(null);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, [selectedCycleId, selectedDivId, currentUser, departments, isGlobalUser, userDivId]);

  // Sync defaults
  useEffect(() => {
    if (!isGlobalUser && userDivId) {
      setSelectedDivId(userDivId);
    } else if (isGlobalUser) {
      setSelectedDivId('all');
    }
  }, [isGlobalUser, userDivId]);

  useEffect(() => {
    if (cfData) {
      setDso(cfData.wcAssumptions.dso);
      setDio(cfData.wcAssumptions.dio);
      setDpo(cfData.wcAssumptions.dpo);
    }
  }, [cfData]);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);

  const handleApplyWc = async () => {
    const activeDivId = isGlobalUser ? selectedDivId : userDivId;
    try {
      setLoading(true);
      const res = await api.post<any>('/projections/recalculate', {
        cycleId: selectedCycleId,
        wcAssumptions: { dso, dio, dpo }
      });
      // Refresh
      fetchCashFlow();
      setIsWcOpen(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCycle) {
      const opt = activeCycle.macroAssumptions.beginningCashOption || 'manual';
      setBegCashOption(opt);
      financingForm.setFieldsValue({
        beginningCashOption: opt,
        beginningCash: activeCycle.macroAssumptions.beginningCash || 0,
        newLoanAmount: activeCycle.macroAssumptions.newLoanAmount || 0,
        loanInterestRate: activeCycle.macroAssumptions.loanInterestRate || 0,
        loanRepaymentAnnual: activeCycle.macroAssumptions.loanRepaymentAnnual || 0,
        dividendsPaid: activeCycle.macroAssumptions.dividendsPaid || 0,
      });
    }
  }, [activeCycle, isFinancingOpen, financingForm]);

  const handleApplyFinancing = async (values: any) => {
    if (activeCycle) {
      await updateMacroAssumptions(activeCycle.id, {
        beginningCashOption: values.beginningCashOption,
        beginningCash: values.beginningCash,
        newLoanAmount: values.newLoanAmount,
        loanInterestRate: values.loanInterestRate,
        loanRepaymentAnnual: values.loanRepaymentAnnual,
        dividendsPaid: values.dividendsPaid,
      });
      fetchCashFlow();
      setIsFinancingOpen(false);
    }
  };

  const calculateSum = (mv: any) => {
    if (!mv) return 0;
    return Object.values(mv as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
  };

  const getCashFlowRows = (): FinancialRow[] => {
    if (!cfData) return [];

    const op = cfData.operatingActivities;
    const inv = cfData.investingActivities;
    const fin = cfData.financingActivities;

    return [
      {
        key: 'op-section',
        name: 'ARUS KAS DARI AKTIVITAS OPERASIONAL',
        isHeader: true,
        values: op.totalOperating
      },
      {
        key: 'net-inc',
        name: 'Laba Bersih Setelah Pajak',
        indent: 1,
        tooltip: 'Transfer langsung dari laporan laba rugi',
        values: op.netIncome
      },
      {
        key: 'dep-adj',
        name: 'Penyesuaian Depresiasi (Non-Kas)',
        indent: 1,
        tooltip: 'Depresiasi ditambahkan kembali karena beban non-kas',
        values: op.depreciationAdj
      },
      {
        key: 'ar-adj',
        name: 'Perubahan Piutang Usaha',
        indent: 1,
        tooltip: 'Kenaikan piutang mengurangi kas (terkunci di pelanggan). Dihitung via DSO.',
        values: op.receivablesChange
      },
      {
        key: 'inv-adj',
        name: 'Perubahan Persediaan',
        indent: 1,
        tooltip: 'Kenaikan stok persediaan mengurangi kas. Dihitung via DIO.',
        values: op.inventoryChange
      },
      {
        key: 'ap-adj',
        name: 'Perubahan Utang Usaha',
        indent: 1,
        tooltip: 'Kenaikan utang pemasok menambah kas (menunda pembayaran). Dihitung via DPO.',
        values: op.payablesChange
      },
      {
        key: 'other-adj',
        name: 'Penyesuaian Operasional Lainnya',
        indent: 1,
        values: op.otherAdjustments
      },
      {
        key: 'total-op',
        name: 'Total Arus Kas Aktivitas Operasional',
        isSubtotal: true,
        values: op.totalOperating
      },

      {
        key: 'inv-section',
        name: 'ARUS KAS DARI AKTIVITAS INVESTASI',
        isHeader: true,
        values: inv.totalInvesting
      },
      {
        key: 'capex',
        name: 'Pengeluaran Modal (CapEx)',
        indent: 1,
        tooltip: 'Pembelian/pengadaan aset tetap (mesin, gedung, IT, mobil)',
        values: inv.capex
      },
      {
        key: 'disposal',
        name: 'Penerimaan Penjualan Aset (Disposal)',
        indent: 1,
        values: inv.assetDisposal
      },
      {
        key: 'inv-other',
        name: 'Investasi Jangka Panjang Lainnya',
        indent: 1,
        values: inv.investments
      },
      {
        key: 'total-inv',
        name: 'Total Arus Kas Aktivitas Investasi',
        isSubtotal: true,
        values: inv.totalInvesting
      },

      {
        key: 'fin-section',
        name: 'ARUS KAS DARI AKTIVITAS PENDANAAN',
        isHeader: true,
        values: fin.totalFinancing
      },
      {
        key: 'loan-proc',
        name: 'Penerimaan Pinjaman Bank',
        indent: 1,
        values: fin.loanProceeds
      },
      {
        key: 'loan-repay',
        name: 'Pembayaran Pokok Pinjaman Bank',
        indent: 1,
        values: fin.loanRepayments
      },
      {
        key: 'div-paid',
        name: 'Pembagian Dividen ke Pemegang Saham',
        indent: 1,
        values: fin.dividendsPaid
      },
      {
        key: 'total-fin',
        name: 'Total Arus Kas Aktivitas Pendanaan',
        isSubtotal: true,
        values: fin.totalFinancing
      },

      {
        key: 'net-cf-title',
        name: 'KENAIKAN / (PENURUNAN) KAS BERSIH',
        isHeader: true,
        values: cfData.netCashFlow
      },
      {
        key: 'net-cf-val',
        name: 'Perubahan Kas Bersih',
        indent: 1,
        values: cfData.netCashFlow
      },
      {
        key: 'open-cash',
        name: 'Saldo Kas Awal Periode',
        indent: 1,
        values: cfData.openingCash
      },
      {
        key: 'close-cash',
        name: 'SALDO KAS AKHIR PERIODE',
        isTotal: true,
        tooltip: 'Saldo kas riil di bank pada akhir bulan',
        values: cfData.closingCash
      }
    ];
  };

  const totalOperating = cfData ? calculateSum(cfData.operatingActivities.totalOperating) : 0;
  const totalInvesting = cfData ? calculateSum(cfData.investingActivities.totalInvesting) : 0;
  const totalFinancing = cfData ? calculateSum(cfData.financingActivities.totalFinancing) : 0;
  const finalCash = cfData ? Object.values(cfData.closingCash)[11] : 0;

  const checkNegativeCash = () => {
    if (!cfData) return { hasNegative: false, month: '' };
    const values = cfData.closingCash;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const keys = Object.keys(values) as (keyof typeof values)[];
    for (let i = 0; i < keys.length; i++) {
      if (values[keys[i]] < 0) {
        return { hasNegative: true, month: months[i], value: values[keys[i]] };
      }
    }
    return { hasNegative: false, month: '' };
  };

  const warning = checkNegativeCash();

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
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Proyeksi Arus Kas (Cash Flow)</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Pantau arus kas masuk dan keluar dari operasi, investasi, dan pendanaan divisi.
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
            <>
              <Button
                type="default"
                icon={<SettingOutlined />}
                onClick={() => setIsFinancingOpen(true)}
              >
                Saldo Awal & Pendanaan
              </Button>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => setIsWcOpen(true)}
              >
                Asumsi Modal Kerja
              </Button>
            </>
          )}
        </Space>
      </div>

      {renderChecklist()}

      {/* Early Warning Banner */}
      {warning.hasNegative && (
        <Alert
          message={
            <span style={{ fontWeight: 600 }}>PERINGATAN: Potensi Saldo Kas Negatif!</span>
          }
          description={
            <span>
              Saldo kas akhir diproyeksikan **negatif** pada bulan **{warning.month}** sebesar <Text strong style={{ color: '#EF4444' }}>{formatCurrency(warning.value || 0, displayUnit)}</Text>. Harap sesuaikan DSO/DIO/DPO atau perkecil rencana CapEx/anggaran biaya.
            </span>
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {!warning.hasNegative && cfData && (
        <Alert
          message="Likuiditas Aman"
          description="Saldo kas akhir tahun diproyeksikan surplus dan tidak terdeteksi adanya saldo kas negatif di setiap bulan berjalan."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {/* KPI Stats */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>TOTAL KAS AKTIVITAS OPERASIONAL</span>}
              value={totalOperating}
              formatter={v => <span className="font-mono text-positive" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatCurrency(Number(v), displayUnit)}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>TOTAL KAS AKTIVITAS INVESTASI</span>}
              value={totalInvesting}
              formatter={v => <span className="font-mono text-negative" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatCurrency(Number(v), displayUnit)}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>TOTAL KAS AKTIVITAS PENDANAAN</span>}
              value={totalFinancing}
              formatter={v => <span className="font-mono text-positive" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatCurrency(Number(v), displayUnit)}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>SALDO KAS AKHIR TAHUNAN</span>}
              value={finalCash}
              formatter={v => <span className="font-mono" style={{ fontSize: '1.4rem', color: '#6366F1', fontWeight: 700 }}>{formatCurrency(Number(v), displayUnit)}</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Cash Flow Table */}
      <FinancialTable
        title={`Proyeksi Arus Kas — RKAP ${activeCycle?.fiscalYear}`}
        rows={getCashFlowRows()}
        loading={loading}
      />

      {/* WORKING CAPITAL MODAL */}
      <Modal
        title="Konfigurasi Asumsi Modal Kerja (Working Capital)"
        open={isWcOpen}
        onCancel={() => setIsWcOpen(false)}
        onOk={handleApplyWc}
        okText="Terapkan & Hitung Ulang"
        cancelText="Batal"
        width={480}
      >
        <div style={{ marginTop: 16 }}>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)' }}>
            Sesuaikan parameter Days Sales Outstanding (DSO), Days Inventory Outstanding (DIO), dan Days Payable Outstanding (DPO) untuk merubah proyeksi kas.
          </Paragraph>

          <div style={{ margin: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong style={{ color: '#fff' }}>Days Sales Outstanding (DSO)</Text>
              <Text className="font-mono" style={{ color: '#10B981' }}>{dso} Hari</Text>
            </div>
            <Slider min={15} max={90} value={dso} onChange={setDso} />
          </div>

          <div style={{ margin: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong style={{ color: '#fff' }}>Days Inventory Outstanding (DIO)</Text>
              <Text className="font-mono" style={{ color: '#10B981' }}>{dio} Hari</Text>
            </div>
            <Slider min={10} max={90} value={dio} onChange={setDio} />
          </div>

          <div style={{ margin: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong style={{ color: '#fff' }}>Days Payable Outstanding (DPO)</Text>
              <Text className="font-mono" style={{ color: '#10B981' }}>{dpo} Hari</Text>
            </div>
            <Slider min={15} max={90} value={dpo} onChange={setDpo} />
          </div>
        </div>
      </Modal>

      {/* FINANCING & BEGINNING CASH MODAL */}
      <Modal
        title="Asumsi Kas Awal & Rencana Pendanaan"
        open={isFinancingOpen}
        onCancel={() => setIsFinancingOpen(false)}
        onOk={() => financingForm.submit()}
        okText="Simpan & Hitung Ulang"
        cancelText="Batal"
        width={500}
      >
        <Form
          form={financingForm}
          onFinish={handleApplyFinancing}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '12px 0' }}>Saldo Awal Kas</Divider>
          
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="beginningCashOption" label="Opsi Saldo Awal" rules={[{ required: true }]}>
                <Select
                  onChange={(val) => setBegCashOption(val)}
                  options={[
                    { value: 'manual', label: 'Input Manual' },
                    { value: 'previous_year', label: 'Tahun Sebelumnya' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="beginningCash" label="Jumlah Saldo Awal (Rp)">
                <InputNumber
                  disabled={begCashOption === 'previous_year'}
                  style={{ width: '100%' }}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '12px 0' }}>Rencana Pinjaman Bank Baru</Divider>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="newLoanAmount" label="Penerimaan Pinjaman Bank (Rp)" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="loanInterestRate" label="Suku Bunga (% / Thn)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="loanRepaymentAnnual" label="Pembayaran Pokok Pinjaman (Rp)" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '12px 0' }}>Pembagian Dividen</Divider>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="dividendsPaid" label="Pembayaran Dividen Tahunan (Rp)" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
