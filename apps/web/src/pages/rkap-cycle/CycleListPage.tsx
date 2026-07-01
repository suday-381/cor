import React, { useState } from 'react';
import { Table, Button, Card, Space, Tag, Modal, Form, InputNumber, Select, Descriptions, Divider, Typography, Alert, Row, Col, Timeline } from 'antd';
import { PlusOutlined, CopyOutlined, HistoryOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { RkapCycle, PeriodType, MacroAssumptions, CYCLE_STATUS_LABELS } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const CycleListPage: React.FC = () => {
  const {
    cycles,
    selectedCycleId,
    selectCycle,
    addCycle,
    copyCycle,
    updateMacroAssumptions,
  } = useAppStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isEditMacroModalOpen, setIsEditMacroModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [activeCycleForModal, setActiveCycleForModal] = useState<RkapCycle | null>(null);

  const [createForm] = Form.useForm();
  const [copyForm] = Form.useForm();
  const [macroForm] = Form.useForm();


  const columns = [
    {
      title: 'Tahun Anggaran',
      dataIndex: 'fiscalYear',
      key: 'fiscalYear',
      render: (text: number, record: RkapCycle) => (
        <span
          style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: record.id === selectedCycleId ? '#10B981' : '#fff',
            cursor: 'pointer'
          }}
          onClick={() => selectCycle(record.id)}
        >
          RKAP {text} {record.id === selectedCycleId && <Tag color="success" style={{ marginLeft: 8 }}>AKTIF</Tag>}
        </span>
      )
    },
    {
      title: 'Tipe Periode',
      dataIndex: 'periodType',
      key: 'periodType',
      render: (text: string) => <span style={{ textTransform: 'capitalize' }}>{text}</span>
    },
    {
      title: 'Status Siklus',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'draft') color = 'default';
        if (status === 'in_review') color = 'warning';
        if (status === 'approved') color = 'success';
        if (status === 'published') color = 'processing';
        if (status === 'locked') color = 'error';
        return <Tag color={color}>{CYCLE_STATUS_LABELS[status as keyof typeof CYCLE_STATUS_LABELS]}</Tag>;
      }
    },
    {
      title: 'Asumsi Makro Utama',
      key: 'macro',
      render: (_: any, record: RkapCycle) => (
        <Space size={12}>
          <span>Inflasi: <Text strong style={{ color: '#fff' }}>{record.macroAssumptions.inflationRate}%</Text></span>
          <span>Kurs: <Text strong style={{ color: '#fff' }}>Rp {record.macroAssumptions.exchangeRateUsdIdr.toLocaleString('id-ID')}</Text></span>
          <span>BI Rate: <Text strong style={{ color: '#fff' }}>{record.macroAssumptions.biInterestRate}%</Text></span>
        </Space>
      )
    },
    {
      title: 'Versi Terkini',
      key: 'version',
      render: (_: any, record: RkapCycle) => (
        <Tag color="purple">v{record.versions[record.versions.length - 1]?.version || 1}</Tag>
      )
    },
    {
      title: 'Aksi',
      key: 'actions',
      render: (_: any, record: RkapCycle) => (
        <Space>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              setActiveCycleForModal(record);
              macroForm.setFieldsValue({
                inflationRate: record.macroAssumptions.inflationRate,
                exchangeRateUsdIdr: record.macroAssumptions.exchangeRateUsdIdr,
                biInterestRate: record.macroAssumptions.biInterestRate,
                industryGrowthRate: record.macroAssumptions.industryGrowthRate,
                taxRate: record.macroAssumptions.taxRate,
              });
              setIsEditMacroModalOpen(true);
            }}
          >
            Asumsi Makro
          </Button>

          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => {
              setActiveCycleForModal(record);
              setIsVersionModalOpen(true);
            }}
          >
            Riwayat Versi
          </Button>

          {record.id === selectedCycleId ? (
            <Button
              type="primary"
              size="small"
              disabled
            >
              Aktif
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() => selectCycle(record.id)}
            >
              Aktifkan
            </Button>
          )}
        </Space>
      )
    }
  ];

  const handleCreate = (values: any) => {
    const macro: MacroAssumptions = {
      inflationRate: values.inflationRate,
      exchangeRateUsdIdr: values.exchangeRateUsdIdr,
      biInterestRate: values.biInterestRate,
      industryGrowthRate: values.industryGrowthRate,
      commodityPrices: { CPO: 12000, Rubber: 8000 },
      taxRate: values.taxRate,
    };
    addCycle(values.fiscalYear, values.periodType, macro);
    setIsCreateModalOpen(false);
    createForm.resetFields();
  };

  const handleCopy = (values: any) => {
    copyCycle(values.sourceCycleId, values.targetYear);
    setIsCopyModalOpen(false);
    copyForm.resetFields();
  };

  const handleUpdateMacro = (values: any) => {
    if (activeCycleForModal) {
      updateMacroAssumptions(activeCycleForModal.id, values);
      setIsEditMacroModalOpen(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Siklus Perencanaan (RKAP)</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Kelola periode penyusunan target keuangan tahunan, parameter makroekonomi, dan salin siklus baseline.
          </Paragraph>
        </div>
        <Space>
          <Button
            type="dashed"
            icon={<CopyOutlined />}
            onClick={() => setIsCopyModalOpen(true)}
            style={{ color: '#10B981', borderColor: '#10B981' }}
          >
            Salin Siklus Terdekat
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Buat Siklus Baru
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={cycles}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* CREATE CYCLE MODAL */}
      <Modal
        title="Buat Siklus RKAP Baru"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        okText="Buat Siklus"
        cancelText="Batal"
        width={550}
      >
        <Form
          form={createForm}
          onFinish={handleCreate}
          layout="vertical"
          initialValues={{ periodType: 'monthly', inflationRate: 3.5, exchangeRateUsdIdr: 15800, biInterestRate: 5.75, industryGrowthRate: 5.0, taxRate: 22 }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fiscalYear"
                label="Tahun Anggaran"
                rules={[{ required: true, message: 'Masukkan tahun anggaran!' }]}
              >
                <InputNumber min={2026} max={2035} style={{ width: '100%' }} placeholder="Contoh: 2027" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="periodType"
                label="Tipe Distribusi Periode"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'annual', label: 'Tahunan' },
                    { value: 'quarterly', label: 'Kuartalan' },
                    { value: 'monthly', label: 'Bulanan' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }}>Konfigurasi Asumsi Makroekonomi</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="inflationRate" label="Asumsi Inflasi (%)" rules={[{ required: true }]}>
                <InputNumber step={0.1} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="exchangeRateUsdIdr" label="Asumsi Kurs (USD/IDR)" rules={[{ required: true }]}>
                <InputNumber step={100} min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="biInterestRate" label="BI Interest Rate (%)" rules={[{ required: true }]}>
                <InputNumber step={0.1} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industryGrowthRate" label="Pertumbuhan Industri (%)" rules={[{ required: true }]}>
                <InputNumber step={0.1} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="taxRate" label="Tarif Pajak Penghasilan (%)" rules={[{ required: true }]}>
                <InputNumber step={1} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* COPY CYCLE MODAL */}
      <Modal
        title="Salin Siklus RKAP dari Baseline"
        open={isCopyModalOpen}
        onCancel={() => setIsCopyModalOpen(false)}
        onOk={() => copyForm.submit()}
        okText="Salin RKAP"
        cancelText="Batal"
        width={480}
      >
        <Alert
          message="Informasi Penyalinan"
          description="Sistem akan menyalin semua parameter makroekonomi, CoA, dan nilai target (revenue/biaya) dari siklus asal sebagai template dasar untuk tahun anggaran baru."
          type="info"
          showIcon
          style={{ marginTop: 12, marginBottom: 16 }}
        />
        <Form
          form={copyForm}
          onFinish={handleCopy}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="sourceCycleId"
            label="Siklus RKAP Asal (Baseline)"
            rules={[{ required: true, message: 'Pilih siklus asal!' }]}
          >
            <Select
              dropdownStyle={{ backgroundColor: '#111827' }}
              options={cycles.map(c => ({
                value: c.id,
                label: `RKAP ${c.fiscalYear} (${CYCLE_STATUS_LABELS[c.status]})`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="targetYear"
            label="Tahun Anggaran Baru"
            rules={[{ required: true, message: 'Masukkan tahun anggaran baru!' }]}
          >
            <InputNumber min={2026} max={2035} style={{ width: '100%' }} placeholder="Contoh: 2028" />
          </Form.Item>
        </Form>
      </Modal>

      {/* EDIT MACRO MODAL */}
      <Modal
        title={`Edit Asumsi Makro — RKAP ${activeCycleForModal?.fiscalYear}`}
        open={isEditMacroModalOpen}
        onCancel={() => setIsEditMacroModalOpen(false)}
        onOk={() => macroForm.submit()}
        okText="Simpan Perubahan"
        cancelText="Batal"
        width={500}
      >
        <Form
          form={macroForm}
          onFinish={handleUpdateMacro}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="inflationRate" label="Inflasi (%)" rules={[{ required: true }]}>
                <InputNumber step={0.1} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="exchangeRateUsdIdr" label="Kurs USD/IDR" rules={[{ required: true }]}>
                <InputNumber step={100} min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="biInterestRate" label="BI Interest Rate (%)" rules={[{ required: true }]}>
                <InputNumber step={0.1} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industryGrowthRate" label="Pertumbuhan Industri (%)" rules={[{ required: true }]}>
                <InputNumber step={0.1} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="taxRate" label="Tarif Pajak PPh (%)" rules={[{ required: true }]}>
                <InputNumber step={1} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* VERSION HISTORY MODAL */}
      <Modal
        title={`Riwayat Perubahan Versi — RKAP ${activeCycleForModal?.fiscalYear}`}
        open={isVersionModalOpen}
        onCancel={() => setIsVersionModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsVersionModalOpen(false)}>Tutup</Button>
        ]}
        width={500}
      >
        <Timeline
          style={{ marginTop: 24 }}
          items={activeCycleForModal?.versions.map((v, i) => ({
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ color: '#fff' }}>Versi {v.version}</Text>
                  <Text type="secondary" style={{ fontSize: '0.78rem' }} className="font-mono">
                    {new Date(v.createdAt).toLocaleString('id-ID')}
                  </Text>
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', display: 'block', marginTop: 4 }}>
                  Diperbarui oleh: <Text strong style={{ color: '#10B981' }}>{v.createdBy}</Text>
                </Text>
                <Paragraph style={{ color: '#fff', fontSize: '0.85rem', marginTop: 4, fontStyle: 'italic' }}>
                  "{v.changeNote}"
                </Paragraph>
              </div>
            )
          }))}
        />
      </Modal>
    </div>
  );
};
