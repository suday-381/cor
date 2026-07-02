import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber, Row, Col, Typography, Tag, Tooltip, Statistic, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { CapExItem, MonthlyValues } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const CapExBudgetPage: React.FC = () => {
  const {
    selectedCycleId,
    cycles,
    capexItems,
    addCapExItem,
    updateCapExItem,
    deleteCapExItem,
    departments,
    currentUser,
  } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CapExItem | null>(null);
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string | undefined>(undefined);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const isGlobalRole = currentUser && ['super_admin', 'csp', 'cfo'].includes(currentUser.role);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const allActiveCapEx = capexItems.filter(cx => cx.cycleId === selectedCycleId);

  const isPastDue = activeCycle?.dueDate ? new Date(activeCycle.dueDate) < new Date() : false;
  const isReadOnly = activeCycle?.status === 'approved' || activeCycle?.status === 'locked' || isPastDue;

  // Filter by selected division/department
  const activeCapEx = useMemo(() => {
    if (!selectedDivisionFilter) return allActiveCapEx;
    return allActiveCapEx.filter(cx => cx.departmentId === selectedDivisionFilter);
  }, [allActiveCapEx, selectedDivisionFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getMonthLabel = (mKey: keyof MonthlyValues) => {
    const labels: Record<keyof MonthlyValues, string> = {
      jan: 'Januari', feb: 'Februari', mar: 'Maret', apr: 'April',
      may: 'Mei', jun: 'Juni', jul: 'Juli', aug: 'Agustus',
      sep: 'September', oct: 'Oktober', nov: 'November', dec: 'Desember'
    };
    return labels[mKey] || mKey;
  };

  const monthOptions = [
    { value: 'jan', label: 'Januari' },
    { value: 'feb', label: 'Februari' },
    { value: 'mar', label: 'Maret' },
    { value: 'apr', label: 'April' },
    { value: 'may', label: 'Mei' },
    { value: 'jun', label: 'Juni' },
    { value: 'jul', label: 'Juli' },
    { value: 'aug', label: 'Agustus' },
    { value: 'sep', label: 'September' },
    { value: 'oct', label: 'Oktober' },
    { value: 'nov', label: 'November' },
    { value: 'dec', label: 'Desember' },
  ];

  const categoryOptions = [
    { value: 'Mesin', label: 'Mesin & Peralatan Pabrik' },
    { value: 'Peralatan IT', label: 'Peralatan IT & Komunikasi' },
    { value: 'Kendaraan', label: 'Kendaraan Operasional' },
    { value: 'Gedung', label: 'Gedung & Bangunan' },
    { value: 'Inventaris', label: 'Inventaris Kantor' },
  ];

  // Determine User's Division & Allowed Departments
  const userDept = departments.find(d => d.id === currentUser?.departmentId);
  const userDivisionId = userDept?.parentId || userDept?.id;
  const allowedDepts = isGlobalRole
    ? departments
    : departments.filter(d => (d.parentId === userDivisionId || d.id === userDivisionId) && d.parentId);

  const deptOptions = allowedDepts.map(d => ({ value: d.id, label: d.name }));

  // Division filter options
  const divisionFilterOptions = useMemo(() => {
    if (!isGlobalRole && userDivisionId) {
      const div = departments.find(d => d.id === userDivisionId);
      return div ? [{ value: div.id, label: div.name }] : [];
    }
    const opts = departments.filter(d => !d.parentId).map(d => ({ value: d.id, label: d.name }));
    return [{ value: '', label: 'Semua Divisi' }, ...opts];
  }, [departments, isGlobalRole, userDivisionId]);

  // KPI Calculations
  const totalBudget = activeCapEx.reduce((sum, item) => sum + item.totalCost, 0);
  const totalAssetsCount = activeCapEx.reduce((sum, item) => sum + item.qty, 0);
  
  const totalAnnualDepreciation = activeCapEx.reduce((sum, item) => {
    const annualDep = item.totalCost / item.usefulLife;
    return sum + annualDep;
  }, 0);

  const columns = [
    {
      title: 'Nama Aset',
      dataIndex: 'assetName',
      key: 'assetName',
      render: (text: string, record: CapExItem) => (
        <div>
          <Text strong style={{ color: '#fff' }}>{text}</Text>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
            Kategori: {record.category}
          </div>
        </div>
      )
    },
    {
      title: 'Departemen',
      dataIndex: 'departmentId',
      key: 'departmentId',
      render: (deptId: string) => {
        const dept = departments.find(d => d.id === deptId);
        return dept ? dept.name : deptId;
      }
    },
    {
      title: 'Qty & Biaya Unit',
      key: 'qtyCost',
      render: (_: any, record: CapExItem) => (
        <div>
          {record.qty}x <span style={{ color: 'rgba(255,255,255,0.65)' }}>{formatCurrency(record.costPerUnit)}</span>
        </div>
      )
    },
    {
      title: 'Total Anggaran',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (val: number) => <span className="font-mono text-positive" style={{ fontWeight: 600 }}>{formatCurrency(val)}</span>
    },
    {
      title: 'Masa Manfaat & Metode',
      key: 'usefulLife',
      render: (_: any, record: CapExItem) => (
        <div>
          {record.usefulLife} Tahun ({record.depreciationMethod === 'straight_line' ? 'Garis Lurus' : 'Saldo Menurun'})
        </div>
      )
    },
    {
      title: 'Bulan Pengadaan',
      dataIndex: 'procurementMonth',
      key: 'procurementMonth',
      render: (month: keyof MonthlyValues) => getMonthLabel(month)
    },
    {
      title: 'Depresiasi / Bulan',
      key: 'monthlyDep',
      render: (_: any, record: CapExItem) => {
        const monthlyDep = record.totalCost / (record.usefulLife * 12);
        return <span className="font-mono text-negative">{formatCurrency(monthlyDep)}</span>;
      }
    },
    ...(!isReadOnly
      ? [
          {
            title: 'Tindakan',
            key: 'actions',
            width: 100,
            render: (_: any, record: CapExItem) => (
              <Space>
                <Button
                  type="text"
                  icon={<EditOutlined style={{ color: '#10B981' }} />}
                  onClick={() => {
                    setActiveItem(record);
                    editForm.setFieldsValue(record);
                    setIsEditModalOpen(true);
                  }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Hapus Item CapEx',
                      content: `Apakah Anda yakin ingin menghapus anggaran CapEx untuk "${record.assetName}"?`,
                      okText: 'Hapus',
                      okType: 'danger',
                      cancelText: 'Batal',
                      onOk: () => deleteCapExItem(record.id),
                    });
                  }}
                />
              </Space>
            )
          }
        ]
      : [])
  ];

  const handleAddSubmit = async (values: any) => {
    const totalCost = values.qty * values.costPerUnit;
    const departmentId = values.departmentId || allowedDepts[0]?.id;
    const success = await addCapExItem({
      ...values,
      departmentId,
      cycleId: selectedCycleId,
      totalCost,
    });
    if (success) {
      setIsAddModalOpen(false);
      addForm.resetFields();
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!activeItem) return;
    const totalCost = values.qty * values.costPerUnit;
    const departmentId = values.departmentId || activeItem.departmentId;
    const success = await updateCapExItem(activeItem.id, {
      ...values,
      departmentId,
      totalCost,
    });
    if (success) {
      setIsEditModalOpen(false);
      setActiveItem(null);
      editForm.resetFields();
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>Penyusunan Anggaran CapEx</Title>
          <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.45)' }}>
            Kelola pengeluaran belanja modal (Capital Expenditure) dan jadwalkan penyusutan aset secara otomatis.
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
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none' }}
            >
              Tambah Belanja Modal
            </Button>
          )}
        </Space>
      </div>

      {/* KPI Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="glass-card">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>Total Anggaran CapEx</span>}
              value={totalBudget}
              formatter={(v) => <span className="font-mono text-positive" style={{ fontSize: '1.8rem', fontWeight: 600 }}>{formatCurrency(Number(v))}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="glass-card">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>Total Volume Aset Baru</span>}
              value={totalAssetsCount}
              formatter={(v) => <span className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 600, color: '#6366F1' }}>{v} Unit</span>}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="glass-card">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>Total Beban Penyusutan Tahunan</span>}
              value={totalAnnualDepreciation}
              formatter={(v) => <span className="font-mono text-negative" style={{ fontSize: '1.8rem', fontWeight: 600 }}>{formatCurrency(Number(v))}</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card title={<span style={{ color: '#fff' }}>Daftar Belanja Modal (RKAP {activeCycle?.fiscalYear})</span>}>
        <Table
          dataSource={activeCapEx}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          size="middle"
        />
      </Card>

      {/* Add Modal */}
      <Modal
        title="Tambah Rencana Belanja Modal (CapEx)"
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          addForm.resetFields();
        }}
        onOk={() => addForm.submit()}
        okText="Simpan"
        cancelText="Batal"
        width={600}
      >
        <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddSubmit}
          initialValues={{
            qty: 1,
            usefulLife: 5,
            depreciationMethod: 'straight_line',
            procurementMonth: 'jan',
            departmentId: userDeptId,
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="assetName"
                label="Nama Aset"
                rules={[{ required: true, message: 'Harap masukkan nama aset' }]}
              >
                <Input placeholder="Contoh: Server Storage Baru" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="departmentId"
                label="Departemen Pemilik"
                rules={[{ required: true, message: 'Harap pilih departemen' }]}
              >
                <Select placeholder="Pilih Departemen" options={deptOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Kategori Aset"
                rules={[{ required: true, message: 'Harap pilih kategori' }]}
              >
                <Select placeholder="Pilih Kategori" options={categoryOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="qty"
                label="Kuantitas (Qty)"
                rules={[{ required: true, message: 'Kuantitas diperlukan' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="costPerUnit"
                label="Biaya per Unit"
                rules={[{ required: true, message: 'Biaya per unit diperlukan' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(v: any) => v ? v.replace(/\./g, '') : ''}
                  placeholder="Masukkan biaya per unit"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="usefulLife"
                label="Masa Manfaat (Tahun)"
                rules={[{ required: true, message: 'Masa manfaat diperlukan' }]}
              >
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="depreciationMethod"
                label="Metode Penyusutan"
                rules={[{ required: true }]}
              >
                <Select options={[
                  { value: 'straight_line', label: 'Garis Lurus (Straight Line)' },
                  { value: 'double_declining', label: 'Saldo Menurun (Double Declining)' }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="procurementMonth"
                label="Bulan Pengadaan"
                rules={[{ required: true }]}
              >
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Catatan Tambahan">
                <Input placeholder="Opsional" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Ubah Rencana Belanja Modal (CapEx)"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setActiveItem(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Simpan Perubahan"
        cancelText="Batal"
        width={600}
      >
        <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="assetName"
                label="Nama Aset"
                rules={[{ required: true, message: 'Harap masukkan nama aset' }]}
              >
                <Input placeholder="Contoh: Server Storage Baru" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="departmentId"
                label="Departemen Pemilik"
                rules={[{ required: true, message: 'Harap pilih departemen' }]}
              >
                <Select placeholder="Pilih Departemen" options={deptOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Kategori Aset"
                rules={[{ required: true, message: 'Harap pilih kategori' }]}
              >
                <Select placeholder="Pilih Kategori" options={categoryOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="qty"
                label="Kuantitas (Qty)"
                rules={[{ required: true, message: 'Kuantitas diperlukan' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="costPerUnit"
                label="Biaya per Unit"
                rules={[{ required: true, message: 'Biaya per unit diperlukan' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(v: any) => v ? v.replace(/\./g, '') : ''}
                  placeholder="Masukkan biaya per unit"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="usefulLife"
                label="Masa Manfaat (Tahun)"
                rules={[{ required: true, message: 'Masa manfaat diperlukan' }]}
              >
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="depreciationMethod"
                label="Metode Penyusutan"
                rules={[{ required: true }]}
              >
                <Select options={[
                  { value: 'straight_line', label: 'Garis Lurus (Straight Line)' },
                  { value: 'double_declining', label: 'Saldo Menurun (Double Declining)' }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="procurementMonth"
                label="Bulan Pengadaan"
                rules={[{ required: true }]}
              >
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Catatan Tambahan">
                <Input placeholder="Opsional" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
