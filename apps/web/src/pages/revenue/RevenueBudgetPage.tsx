import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber, Row, Col, Typography, Collapse, Tabs, Tooltip, Tag, Statistic, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BarChartOutlined, ArrowUpOutlined, InfoCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { MonthlyGrid } from '@/components/common/MonthlyGrid';
import { RevenueLineItem, MonthlyValues, MONTH_KEYS, MONTH_LABELS } from '@/types';
import { formatCurrency } from '@/utils/format';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export const RevenueBudgetPage: React.FC = () => {
  const {
    selectedCycleId,
    cycles,
    revenueItems,
    addRevenueItem,
    updateRevenueItem,
    deleteRevenueItem,
    coa,
    departments,
    currentUser,
    displayUnit,
  } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<RevenueLineItem | null>(null);
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string | undefined>(undefined);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const isGlobalRole = currentUser && ['super_admin', 'csp', 'cfo'].includes(currentUser.role);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const allActiveRevs = revenueItems.filter(r => r.cycleId === selectedCycleId);

  const isPastDue = activeCycle?.dueDate ? new Date(activeCycle.dueDate) < new Date() : false;
  const isReadOnly = activeCycle?.status === 'approved' || activeCycle?.status === 'locked' || isPastDue;

  // Filter by selected division/department
  const activeRevs = useMemo(() => {
    if (!selectedDivisionFilter) return allActiveRevs;
    return allActiveRevs.filter(r => r.departmentId === selectedDivisionFilter);
  }, [allActiveRevs, selectedDivisionFilter]);

  const calculateSum = (mv: MonthlyValues) => {
    return Object.values(mv).reduce((a, b) => a + b, 0);
  };

  const coaOptions = coa
    .filter(c => c.accountType === 'revenue')
    .map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  const deptOptions = departments
    .filter(d => d.isRevenueCenter)
    .map(d => ({ value: d.id, label: d.name }));

  // Determine User's Division & Allowed Departments
  const userDept = departments.find(d => d.id === currentUser?.departmentId);
  const userDivisionId = userDept?.parentId || userDept?.id;
  const allowedDepts = isGlobalRole
    ? departments.filter(d => d.isRevenueCenter)
    : departments.filter(d => d.isRevenueCenter && (d.parentId === userDivisionId || d.id === userDivisionId) && d.parentId);

  const allowedDeptOptions = allowedDepts.map(d => ({ value: d.id, label: d.name }));

  // Division filter options
  const divisionFilterOptions = useMemo(() => {
    if (!isGlobalRole && userDivisionId) {
      const div = departments.find(d => d.id === userDivisionId && d.isRevenueCenter);
      return div ? [{ value: div.id, label: div.name }] : [];
    }
    const opts = departments.filter(d => !d.parentId && d.isRevenueCenter).map(d => ({ value: d.id, label: d.name }));
    return [{ value: '', label: 'Semua Divisi' }, ...opts];
  }, [departments, isGlobalRole, userDivisionId]);

  const columns = [
    {
      title: 'Pelanggan & Proyek',
      key: 'customerProject',
      render: (_: any, record: RevenueLineItem) => (
        <div>
          <Text strong style={{ color: '#fff' }}>{record.customer || '-'}</Text>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
            Proyek: {record.project || '-'}
          </div>
        </div>
      )
    },
    {
      title: 'Produk / Layanan',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: RevenueLineItem) => (
        <div>
          <Text strong style={{ color: '#fff' }}>{text}</Text>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
            Segment: {record.segment} | Channel: {record.channel}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'revenueStatus',
      key: 'revenueStatus',
      render: (status?: string) => {
        const isSustain = (status || 'sustain') === 'sustain';
        return (
          <Tag color={isSustain ? 'blue' : 'purple'}>
            {isSustain ? 'Sustain' : 'Scaling'}
          </Tag>
        );
      }
    },
    {
      title: 'Akun Pendapatan',
      dataIndex: 'accountId',
      key: 'accountId',
      render: (accId: string) => {
        const item = coa.find(c => c.id === accId);
        return item ? `${item.code} - ${item.name}` : '-';
      }
    },
    {
      title: 'Asumsi Harga & Diskon',
      key: 'assumptions',
      render: (_: any, record: RevenueLineItem) => (
        <Space direction="vertical" size={2}>
          <span>Vol: <Text strong style={{ color: '#fff' }}>{record.assumptions.volume.toLocaleString('id-ID')}</Text></span>
          <span>Harga: <Text strong style={{ color: '#fff' }}>{formatCurrency(record.assumptions.pricePerUnit, displayUnit)}</Text></span>
          <span>Diskon: <Text strong style={{ color: '#EF4444' }}>{record.assumptions.discountRate}%</Text></span>
        </Space>
      )
    },
    {
      title: 'Anggaran Tahun Sebelumnya',
      key: 'prevYear',
      render: (_: any, record: RevenueLineItem) => {
        const sum = record.previousYear ? calculateSum(record.previousYear) : 0;
        return <span className="font-mono text-muted">{formatCurrency(sum, displayUnit)}</span>;
      }
    },
    {
      title: 'Target Anggaran (Target)',
      key: 'targetYear',
      render: (_: any, record: RevenueLineItem) => {
        const sum = calculateSum(record.monthlyTargets);
        return <span className="font-mono text-positive" style={{ fontWeight: 600 }}>{formatCurrency(sum, displayUnit)}</span>;
      }
    },
    {
      title: 'YoY %',
      key: 'yoy',
      render: (_: any, record: RevenueLineItem) => {
        const targetSum = calculateSum(record.monthlyTargets);
        const prevSum = record.previousYear ? calculateSum(record.previousYear) : 0;
        if (prevSum === 0) return <Tag color="success">+100.0% (YoY)</Tag>;
        const growth = ((targetSum - prevSum) / prevSum) * 100;
        return (
          <Tag color={growth >= 0 ? 'success' : 'error'}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
          </Tag>
        );
      }
    },
    ...(!isReadOnly
      ? [
          {
            title: 'Aksi',
            key: 'actions',
            render: (_: any, record: RevenueLineItem) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setActiveItem(record);
                    editForm.setFieldsValue({
                      productName: record.productName,
                      segment: record.segment,
                      channel: record.channel,
                      accountId: record.accountId,
                      departmentId: record.departmentId,
                      volume: record.assumptions.volume,
                      pricePerUnit: record.assumptions.pricePerUnit,
                      discountRate: record.assumptions.discountRate,
                      customer: record.customer,
                      project: record.project,
                      revenueStatus: record.revenueStatus || 'sustain',
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
                  onClick={() => deleteRevenueItem(record.id)}
                />
              </Space>
            ),
          },
        ]
      : []),
  ];

  const handleAdd = async (values: any) => {
    const defaultMv: MonthlyValues = {
      jan: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      feb: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      mar: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      apr: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      may: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      jun: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      jul: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      aug: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      sep: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      oct: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      nov: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
      dec: Math.round((values.volume * values.pricePerUnit * (1 - values.discountRate / 100)) / 12),
    };

    const departmentId = values.departmentId || allowedDepts[0]?.id;

    const success = await addRevenueItem({
      cycleId: selectedCycleId,
      departmentId,
      accountId: values.accountId,
      productName: values.productName,
      segment: values.segment,
      channel: values.channel,
      monthlyTargets: defaultMv,
      assumptions: {
        volume: values.volume,
        pricePerUnit: values.pricePerUnit,
        discountRate: values.discountRate,
      },
      previousYear: { ...defaultMv, jan: Math.round(defaultMv.jan * 0.9) }, // Mock prev year
      customer: values.customer,
      project: values.project,
      revenueStatus: values.revenueStatus || 'sustain',
    });

    if (success) {
      setIsAddModalOpen(false);
      addForm.resetFields();
    }
  };

  const handleEdit = async (values: any) => {
    if (activeItem) {
      const departmentId = values.departmentId || activeItem.departmentId;
      const success = await updateRevenueItem(activeItem.id, {
        productName: values.productName,
        segment: values.segment,
        channel: values.channel,
        accountId: values.accountId,
        departmentId,
        assumptions: {
          volume: values.volume,
          pricePerUnit: values.pricePerUnit,
          discountRate: values.discountRate,
        },
        customer: values.customer,
        project: values.project,
        revenueStatus: values.revenueStatus || 'sustain',
      });
      if (success) {
        setIsEditModalOpen(false);
      }
    }
  };

  const totalTargetRevenue = activeRevs.reduce((acc, item) => acc + calculateSum(item.monthlyTargets), 0);
  const totalPrevRevenue = activeRevs.reduce((acc, item) => acc + (item.previousYear ? calculateSum(item.previousYear) : 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Anggaran Pendapatan</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Tentukan rencana pendapatan per segmen produk, atur distribusi bulanan, dan tinjau target pertumbuhan YoY.
          </Paragraph>
        </div>
        <Space>
          <Select
            style={{ minWidth: 220 }}
            placeholder="Filter Divisi / Departemen"
            value={selectedDivisionFilter || ''}
            onChange={(val) => setSelectedDivisionFilter(val || undefined)}
            options={divisionFilterOptions}
            suffixIcon={<FilterOutlined />}
            dropdownStyle={{ backgroundColor: '#111827' }}
          />
          {!isReadOnly && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (!isGlobalRole && userDeptId) {
                  addForm.setFieldsValue({ departmentId: userDeptId });
                }
                setIsAddModalOpen(true);
              }}
            >
              Tambah Target Revenue
            </Button>
          )}
        </Space>
      </div>

      {/* Summary Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card bordered={false} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>TOTAL TARGET REVENUE TAHUNAN</span>}
              value={totalTargetRevenue}
              formatter={value => <span className="font-mono text-positive" style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(Number(value), displayUnit)}</span>}
            />
            {totalPrevRevenue > 0 && (
              <div style={{ marginTop: 8 }}>
                <Tag color="success">
                  <ArrowUpOutlined /> {(((totalTargetRevenue - totalPrevRevenue) / totalPrevRevenue) * 100).toFixed(1)}% pertumbuhan YoY
                </Tag>
                <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.85rem' }}>vs {formatCurrency(totalPrevRevenue, displayUnit)} tahun lalu</span>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Table List of Products */}
      <Card title={<span style={{ color: '#fff' }}>Daftar Target Pendapatan</span>} style={{ marginBottom: 24 }}>
        <Table
          dataSource={activeRevs}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Accordion view for editing monthly distribution */}
      {activeRevs.length > 0 && (
        <Card title={<span style={{ color: '#fff' }}>Distribusi Bulan Target (Jan - Des)</span>}>
          <Collapse accordion defaultActiveKey={[activeRevs[0].id]}>
            {activeRevs.map(item => (
              <Panel
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
                    <Text strong style={{ color: '#fff' }}>{item.productName} ({item.segment})</Text>
                    <Text className="font-mono" style={{ color: '#10B981' }}>{formatCurrency(calculateSum(item.monthlyTargets), displayUnit)}</Text>
                  </div>
                }
                key={item.id}
              >
                <div style={{ padding: '8px 0' }}>
                  <Paragraph style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Gunakan grid di bawah untuk mendistribusikan target penjualan bulanan. Total tahunan akan diperbarui secara otomatis.
                  </Paragraph>
                  <MonthlyGrid
                    disabled={isReadOnly}
                    value={item.monthlyTargets}
                    onChange={(newValue) => updateRevenueItem(item.id, { monthlyTargets: newValue })}
                  />
                </div>
              </Panel>
            ))}
          </Collapse>
        </Card>
      )}

      {/* ADD TARGET MODAL */}
      <Modal
        title="Tambah Target Pendapatan Baru"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={() => addForm.submit()}
        okText="Simpan Target"
        cancelText="Batal"
        width={550}
      >
        <Form
          form={addForm}
          onFinish={handleAdd}
          layout="vertical"
          initialValues={{ departmentId: allowedDeptOptions[0]?.value, volume: 1000, pricePerUnit: 1000000, discountRate: 0, revenueStatus: 'sustain' }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer"
                label="Customer / Client"
                rules={[{ required: true, message: 'Masukkan nama customer!' }]}
              >
                <Input placeholder="Contoh: Bank Indonesia / Bank Mandiri" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project"
                label="Nama Proyek / Kerja Sama"
                rules={[{ required: true, message: 'Masukkan nama proyek!' }]}
              >
                <Input placeholder="Contoh: Distribusi Uang Kas PJPUR" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="productName"
                label="Nama Produk / Layanan"
                rules={[{ required: true, message: 'Masukkan nama produk!' }]}
              >
                <Input placeholder="Contoh: Lisensi Software Enterprise" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="revenueStatus"
                label="Status Pendapatan"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'sustain', label: 'Sustain' },
                    { value: 'scaling', label: 'Scaling' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="segment" label="Segmen Pelanggan" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'Enterprise', label: 'Enterprise' },
                    { value: 'SME', label: 'SME / Menengah' },
                    { value: 'Retail', label: 'Retail / Individu' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel" label="Channel Penjualan" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'Direct Sales', label: 'Direct Sales' },
                    { value: 'Partner/Reseller', label: 'Partner/Reseller' },
                    { value: 'E-Commerce', label: 'E-Commerce' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountId" label="Akun Pendapatan (CoA)" rules={[{ required: true }]}>
                <Select options={coaOptions} dropdownStyle={{ backgroundColor: '#111827' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="departmentId" label="Departemen Penanggung Jawab" rules={[{ required: true }]}>
                <Select options={allowedDeptOptions} dropdownStyle={{ backgroundColor: '#111827' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }}>Asumsi Rencana Volume & Harga</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="volume" label="Volume Target" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="pricePerUnit" label="Harga per Unit" rules={[{ required: true }]}>
                <InputNumber min={1} formatter={(v: any) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v: any) => v ? v.replace(/\./g, '') : ''} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="discountRate" label="Diskon (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* EDIT TARGET MODAL */}
      <Modal
        title="Edit Detail Pendapatan"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => editForm.submit()}
        okText="Simpan Perubahan"
        cancelText="Batal"
        width={550}
      >
        <Form
          form={editForm}
          onFinish={handleEdit}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer"
                label="Customer / Client"
                rules={[{ required: true, message: 'Masukkan nama customer!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project"
                label="Nama Proyek / Kerja Sama"
                rules={[{ required: true, message: 'Masukkan nama proyek!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="productName"
                label="Nama Produk / Layanan"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="revenueStatus"
                label="Status Pendapatan"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'sustain', label: 'Sustain' },
                    { value: 'scaling', label: 'Scaling' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="segment" label="Segmen Pelanggan" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'Enterprise', label: 'Enterprise' },
                    { value: 'SME', label: 'SME' },
                    { value: 'Retail', label: 'Retail' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel" label="Channel Penjualan" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'Direct Sales', label: 'Direct Sales' },
                    { value: 'Partner/Reseller', label: 'Partner/Reseller' },
                    { value: 'E-Commerce', label: 'E-Commerce' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountId" label="Akun Pendapatan (CoA)" rules={[{ required: true }]}>
                <Select options={coaOptions} dropdownStyle={{ backgroundColor: '#111827' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="departmentId" label="Departemen Penanggung Jawab" rules={[{ required: true }]}>
                <Select options={allowedDeptOptions} dropdownStyle={{ backgroundColor: '#111827' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }}>Asumsi Rencana Volume & Harga</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="volume" label="Volume Target" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="pricePerUnit" label="Harga per Unit" rules={[{ required: true }]}>
                <InputNumber min={1} formatter={(v: any) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v: any) => v ? v.replace(/\./g, '') : ''} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="discountRate" label="Diskon (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
