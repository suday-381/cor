import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber, Row, Col, Typography, Collapse, Tabs, Tag, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { MonthlyGrid } from '@/components/common/MonthlyGrid';
import { CostLineItem, MonthlyValues, COST_CATEGORY_LABELS } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export const CostBudgetPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedCycleId,
    cycles,
    costItems,
    addCostItem,
    updateCostItem,
    deleteCostItem,
    coa,
    departments,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('opex');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CostLineItem | null>(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();


  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const activeCosts = costItems.filter(c => c.cycleId === selectedCycleId);
  const isReadOnly = activeCycle?.status === 'approved' || activeCycle?.status === 'locked';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const calculateSum = (mv: MonthlyValues) => {
    return Object.values(mv).reduce((a, b) => a + b, 0);
  };

  const coaOptions = coa
    .filter(c => c.accountType === 'expense')
    .map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  const deptOptions = departments.map(d => ({ value: d.id, label: d.name }));

  const columns = [
    {
      title: 'Kode & Nama Akun',
      key: 'account',
      render: (_: any, record: CostLineItem) => (
        <div>
          <Text strong style={{ color: '#fff' }}>{record.accountCode} - {record.accountName}</Text>
          {record.notes && (
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
              Catatan: {record.notes}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Departemen',
      dataIndex: 'departmentId',
      key: 'departmentId',
      render: (deptId: string) => {
        const item = departments.find(d => d.id === deptId);
        return item ? item.name : '-';
      }
    },
    {
      title: 'Kategori Biaya',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => {
        let color = 'default';
        if (cat === 'fixed') color = 'blue';
        if (cat === 'variable') color = 'orange';
        if (cat === 'semi_variable') color = 'purple';
        return <Tag color={color}>{COST_CATEGORY_LABELS[cat as keyof typeof COST_CATEGORY_LABELS]}</Tag>;
      }
    },
    {
      title: 'Anggaran Tahunan',
      key: 'totalYear',
      render: (_: any, record: CostLineItem) => {
        const sum = calculateSum(record.monthlyAmounts);
        return <span className="font-mono text-positive" style={{ fontWeight: 600 }}>{formatCurrency(sum)}</span>;
      }
    },
    ...(!isReadOnly
      ? [
          {
            title: 'Aksi',
            key: 'actions',
            render: (_: any, record: CostLineItem) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setActiveItem(record);
                    editForm.setFieldsValue({
                      accountId: record.accountId,
                      departmentId: record.departmentId,
                      category: record.category,
                      notes: record.notes,
                    });
                    setIsEditModalOpen(true);
                  }}
                >
                  Edit Detail
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteCostItem(record.id)}
                />
              </Space>
            ),
          },
        ]
      : []),
  ];

  const handleAdd = (values: any) => {
    const selectedCoa = coa.find(c => c.id === values.accountId);
    if (!selectedCoa) return;

    const defaultMv: MonthlyValues = {
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
    };

    addCostItem({
      cycleId: selectedCycleId,
      departmentId: values.departmentId,
      accountId: values.accountId,
      accountCode: selectedCoa.code,
      accountName: selectedCoa.name,
      category: values.category,
      monthlyAmounts: defaultMv,
      notes: values.notes,
    });

    setIsAddModalOpen(false);
    addForm.resetFields();
  };

  const handleEdit = (values: any) => {
    if (activeItem) {
      const selectedCoa = coa.find(c => c.id === values.accountId);
      updateCostItem(activeItem.id, {
        accountId: values.accountId,
        accountCode: selectedCoa?.code || activeItem.accountCode,
        accountName: selectedCoa?.name || activeItem.accountName,
        departmentId: values.departmentId,
        category: values.category,
        notes: values.notes,
      });
      setIsEditModalOpen(false);
    }
  };

  const totalOpex = activeCosts.reduce((acc, item) => acc + calculateSum(item.monthlyAmounts), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Anggaran Biaya (OpEx)</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Susun pengeluaran operasional berdasarkan CoA departemen, bedakan kategori biaya, dan kelola headcount karyawan.
          </Paragraph>
        </div>
        <Space>
          <Button
            type="dashed"
            icon={<UserOutlined />}
            onClick={() => navigate('/costs/personnel')}
            style={{ color: '#10B981', borderColor: '#10B981' }}
          >
            Personalia / Headcount
          </Button>
          {!isReadOnly && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Tambah Anggaran Biaya
            </Button>
          )}
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'opex',
            label: 'Biaya Operasional Umum',
            children: (
              <>
                {/* Total Cost card */}
                <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                  <Col xs={24} md={12}>
                    <Card bordered={false} bodyStyle={{ padding: 20 }}>
                      <Statistic
                        title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>TOTAL ANGGARAN OPEX TAHUNAN</span>}
                        value={totalOpex}
                        formatter={value => <span className="font-mono text-positive" style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(Number(value))}</span>}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title={<span style={{ color: '#fff' }}>Daftar Pengeluaran Operasional</span>} style={{ marginBottom: 24 }}>
                  <Table
                    dataSource={activeCosts}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                  />
                </Card>

                {activeCosts.length > 0 && (
                  <Card title={<span style={{ color: '#fff' }}>Distribusi Bulan Pengeluaran (Jan - Des)</span>}>
                    <Collapse accordion defaultActiveKey={[activeCosts[0].id]}>
                      {activeCosts.map(item => {
                        const dept = departments.find(d => d.id === item.departmentId);
                        return (
                          <Panel
                            header={
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
                                <Text strong style={{ color: '#fff' }}>{item.accountCode} - {item.accountName} ({dept?.name || 'Umum'})</Text>
                                <Text className="font-mono" style={{ color: '#10B981' }}>{formatCurrency(calculateSum(item.monthlyAmounts))}</Text>
                              </div>
                            }
                            key={item.id}
                          >
                            <div style={{ padding: '8px 0' }}>
                              <Paragraph style={{ color: 'rgba(255,255,255,0.45)' }}>
                                Masukkan besaran pengeluaran untuk setiap bulan. Angka ini secara otomatis terakumulasi dalam proyeksi Laba Rugi.
                              </Paragraph>
                              <MonthlyGrid
                                disabled={isReadOnly}
                                value={item.monthlyAmounts}
                                onChange={(newValue) => updateCostItem(item.id, { monthlyAmounts: newValue })}
                              />
                            </div>
                          </Panel>
                        );
                      })}
                    </Collapse>
                  </Card>
                )}
              </>
            ),
          },
        ]}
      />

      {/* ADD COST MODAL */}
      <Modal
        title="Tambah Anggaran Biaya Baru"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={() => addForm.submit()}
        okText="Simpan Biaya"
        cancelText="Batal"
        width={500}
      >
        <Form
          form={addForm}
          onFinish={handleAdd}
          layout="vertical"
          initialValues={{ departmentId: 'd-ops', category: 'fixed' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="accountId" label="Akun Pengeluaran (CoA)" rules={[{ required: true, message: 'Pilih Akun CoA!' }]}>
            <Select options={coaOptions} dropdownStyle={{ backgroundColor: '#111827' }} showSearch optionFilterProp="label" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="departmentId" label="Departemen" rules={[{ required: true }]}>
                <Select options={deptOptions} dropdownStyle={{ backgroundColor: '#111827' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Kategori Sifat Biaya" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'fixed', label: 'Biaya Tetap (Fixed)' },
                    { value: 'variable', label: 'Biaya Variabel (Variable)' },
                    { value: 'semi_variable', label: 'Biaya Semi-Variabel' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Catatan / Justifikasi">
            <Input.TextArea placeholder="Misal: Dihitung berdasarkan perkiraan kenaikan tarif dasar listrik" rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* EDIT COST MODAL */}
      <Modal
        title="Edit Detail Anggaran Biaya"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => editForm.submit()}
        okText="Simpan Perubahan"
        cancelText="Batal"
        width={500}
      >
        <Form
          form={editForm}
          onFinish={handleEdit}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item name="accountId" label="Akun Pengeluaran (CoA)" rules={[{ required: true }]}>
            <Select options={coaOptions} dropdownStyle={{ backgroundColor: '#111827' }} showSearch optionFilterProp="label" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="departmentId" label="Departemen" rules={[{ required: true }]}>
                <Select options={deptOptions} dropdownStyle={{ backgroundColor: '#111827' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Kategori Sifat Biaya" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'fixed', label: 'Biaya Tetap (Fixed)' },
                    { value: 'variable', label: 'Biaya Variabel (Variable)' },
                    { value: 'semi_variable', label: 'Biaya Semi-Variabel' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Catatan / Justifikasi">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
