import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber, Row, Col, Typography, Statistic, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { PersonnelCost } from '@/types';
import { formatCurrency } from '@/utils/format';

const { Title, Text, Paragraph } = Typography;

export const PersonnelCostPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedCycleId,
    cycles,
    personnelItems,
    addPersonnelItem,
    updatePersonnelItem,
    deletePersonnelItem,
    departments,
    displayUnit,
  } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PersonnelCost | null>(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();


  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const allActiveStaff = personnelItems.filter(p => p.cycleId === selectedCycleId);
  const isPastDue = activeCycle?.dueDate ? new Date(activeCycle.dueDate) < new Date() : false;
  const isReadOnly = activeCycle?.status === 'approved' || activeCycle?.status === 'locked' || isPastDue;

  const currentUserData = useAppStore(state => state.currentUser);
  const isGlobalRole = currentUserData && ['super_admin', 'csp', 'cfo'].includes(currentUserData.role);
  
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string | undefined>(undefined);

  const activeStaff = React.useMemo(() => {
    if (!selectedDivisionFilter) return allActiveStaff;
    return allActiveStaff.filter(s => s.departmentId === selectedDivisionFilter);
  }, [allActiveStaff, selectedDivisionFilter]);

  // Determine User's Division & Allowed Departments
  const userDept = departments.find(d => d.id === currentUserData?.departmentId);
  const userDivisionId = userDept?.parentId || userDept?.id;
  const allowedDepts = isGlobalRole
    ? departments
    : departments.filter(d => (d.parentId === userDivisionId || d.id === userDivisionId) && d.parentId);

  const deptOptions = allowedDepts.map(d => ({ value: d.id, label: d.name }));

  // Division filter options
  const divisionFilterOptions = React.useMemo(() => {
    if (!isGlobalRole && userDivisionId) {
      const div = departments.find(d => d.id === userDivisionId);
      return div ? [{ value: div.id, label: div.name }] : [];
    }
    const opts = departments.filter(d => !d.parentId).map(d => ({ value: d.id, label: d.name }));
    return [{ value: '', label: 'Semua Divisi' }, ...opts];
  }, [departments, isGlobalRole, userDivisionId]);

  const columns = [
    {
      title: 'Jabatan / Posisi',
      dataIndex: 'position',
      key: 'position',
      render: (text: string) => <Text strong style={{ color: '#fff' }}>{text}</Text>
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
      dataIndex: 'costCategory',
      key: 'costCategory',
      render: (cat?: string) => {
        const isCogs = (cat || 'opex').toLowerCase() === 'cogs';
        return (
          <Tag color={isCogs ? 'success' : 'processing'}>
            {isCogs ? 'COGS (Direct)' : 'OPEX (Indirect)'}
          </Tag>
        );
      }
    },
    {
      title: 'Jumlah Karyawan (HC)',
      dataIndex: 'headcount',
      key: 'headcount',
      align: 'center' as const,
      render: (hc: number) => <span className="font-mono" style={{ fontWeight: 600 }}>{hc}</span>
    },
    {
      title: 'Gaji Pokok Bulanan',
      dataIndex: 'monthlySalary',
      key: 'monthlySalary',
      render: (val: number) => <span className="font-mono">{formatCurrency(val, displayUnit)}</span>
    },
    {
      title: 'Tunjangan',
      dataIndex: 'allowances',
      key: 'allowances',
      render: (val: number) => <span className="font-mono">{formatCurrency(val, displayUnit)}</span>
    },
    {
      title: 'BPJS & Manfaat',
      dataIndex: 'bpjs',
      key: 'bpjs',
      render: (val: number) => <span className="font-mono">{formatCurrency(val, displayUnit)}</span>
    },
    {
      title: 'Bonus / THR (Tahunan)',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (val: number) => <span className="font-mono text-warning">{formatCurrency(val, displayUnit)}</span>
    },
    {
      title: 'Total Anggaran Tahunan',
      dataIndex: 'totalAnnual',
      key: 'totalAnnual',
      render: (val: number) => <span className="font-mono text-positive" style={{ fontWeight: 700 }}>{formatCurrency(val, displayUnit)}</span>
    },
    ...(!isReadOnly
      ? [
          {
            title: 'Aksi',
            key: 'actions',
            render: (_: any, record: PersonnelCost) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setActiveItem(record);
                    editForm.setFieldsValue({
                      position: record.position,
                      departmentId: record.departmentId,
                      headcount: record.headcount,
                      monthlySalary: record.monthlySalary,
                      allowances: record.allowances,
                      bpjs: record.bpjs,
                      bonus: record.bonus,
                      costCategory: record.costCategory || 'opex',
                    });
                    setIsEditModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deletePersonnelItem(record.id)}
                />
              </Space>
            ),
          },
        ]
      : []),
  ];

  const handleAdd = async (values: any) => {
    // Total Annual = HC * (Salary + Allowances + BPJS) * 12 + HC * Bonus
    const totalAnnual = values.headcount * (values.monthlySalary + values.allowances + values.bpjs) * 12 + values.headcount * values.bonus;

    const success = await addPersonnelItem({
      cycleId: selectedCycleId,
      departmentId: values.departmentId || allowedDepts[0]?.id,
      position: values.position,
      headcount: values.headcount,
      monthlySalary: values.monthlySalary,
      allowances: values.allowances,
      bpjs: values.bpjs,
      bonus: values.bonus,
      totalAnnual,
      costCategory: values.costCategory || 'opex',
    });

    if (success) {
      setIsAddModalOpen(false);
      addForm.resetFields();
    }
  };

  const handleEdit = async (values: any) => {
    if (activeItem) {
      const totalAnnual = values.headcount * (values.monthlySalary + values.allowances + values.bpjs) * 12 + values.headcount * values.bonus;

      const success = await updatePersonnelItem(activeItem.id, {
        position: values.position,
        departmentId: values.departmentId || activeItem.departmentId,
        headcount: values.headcount,
        monthlySalary: values.monthlySalary,
        allowances: values.allowances,
        bpjs: values.bpjs,
        bonus: values.bonus,
        totalAnnual,
        costCategory: values.costCategory || 'opex',
      });
      if (success) {
        setIsEditModalOpen(false);
      }
    }
  };

  const totalHeadcount = activeStaff.reduce((acc, item) => acc + item.headcount, 0);
  const totalAnnualStaffCost = activeStaff.reduce((acc, item) => acc + item.totalAnnual, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space size={12}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/costs')}
          />
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>Anggaran Personalia (Headcount)</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Kelola rencana rekrutmen jabatan, gaji, tunjangan, dan perhitungan BPJS secara bulanan dan tahunan.
            </Paragraph>
          </div>
        </Space>
        <Space>
          <Select
            style={{ minWidth: 220 }}
            placeholder="Filter Divisi / Departemen"
            value={selectedDivisionFilter || ''}
            onChange={(val) => setSelectedDivisionFilter(val || undefined)}
            options={divisionFilterOptions}
            dropdownStyle={{ backgroundColor: '#111827' }}
          />
        </Space>
        {!isReadOnly && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Tambah Perencanaan Staf
          </Button>
        )}
      </div>

      {/* Statistics Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card bordered={false} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>TOTAL KARYAWAN DIRENCANAKAN (HEADCOUNT)</span>}
              value={totalHeadcount}
              formatter={value => <span className="font-mono text-positive" style={{ fontSize: '2rem', fontWeight: 700 }}>{value} Orang</span>}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card bordered={false} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>TOTAL BIAYA PERSONALIA TAHUNAN</span>}
              value={totalAnnualStaffCost}
              formatter={value => <span className="font-mono text-positive" style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(Number(value), displayUnit)}</span>}
            />
          </Card>
        </Col>
      </Row>

      <Card title={<span style={{ color: '#fff' }}>Daftar Jabatan & Alokasi Anggaran</span>}>
        <Table
          dataSource={activeStaff}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* ADD STAFF MODAL */}
      <Modal
        title="Tambah Perencanaan Staf Baru"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={() => addForm.submit()}
        okText="Simpan Perencanaan"
        cancelText="Batal"
        width={550}
      >
        <Form
          form={addForm}
          onFinish={handleAdd}
          layout="vertical"
          initialValues={{ departmentId: allowedDepts[0]?.id, headcount: 1, monthlySalary: 5000000, allowances: 1000000, bpjs: 500000, bonus: 5000000, costCategory: 'opex' }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="position" label="Nama Jabatan / Posisi" rules={[{ required: true, message: 'Masukkan nama posisi!' }]}>
                <Input placeholder="Contoh: Senior Business Analyst" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="departmentId" label="Departemen" rules={[{ required: true }]}>
                <Select options={deptOptions} dropdownStyle={{ backgroundColor: '#111827' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="costCategory" label="Kategori Beban Gaji" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'cogs', label: 'COGS (Karyawan Langsung / Direct Cost)' },
                    { value: 'opex', label: 'OPEX (Karyawan Tidak Langsung / Indirect Cost)' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="headcount" label="Jumlah Orang (HC)" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="monthlySalary" label="Gaji Pokok per Orang (Bulanan)" rules={[{ required: true }]}>
                <InputNumber min={1} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="allowances" label="Tunjangan per Orang (Bulanan)" rules={[{ required: true }]}>
                <InputNumber min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bpjs" label="BPJS & Manfaat Kesehatan (Bulanan)" rules={[{ required: true }]}>
                <InputNumber min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bonus" label="Bonus & THR per Orang (Tahunan)" rules={[{ required: true }]}>
                <InputNumber min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* EDIT STAFF MODAL */}
      <Modal
        title="Edit Perencanaan Staf"
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
            <Col span={14}>
              <Form.Item name="position" label="Nama Jabatan / Posisi" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="departmentId" label="Departemen" rules={[{ required: true }]}>
                <Select options={deptOptions} dropdownStyle={{ backgroundColor: '#111827' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="costCategory" label="Kategori Beban Gaji" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'cogs', label: 'COGS (Karyawan Langsung / Direct Cost)' },
                    { value: 'opex', label: 'OPEX (Karyawan Tidak Langsung / Indirect Cost)' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="headcount" label="Jumlah Orang (HC)" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="monthlySalary" label="Gaji Pokok per Orang (Bulanan)" rules={[{ required: true }]}>
                <InputNumber min={1} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="allowances" label="Tunjangan per Orang (Bulanan)" rules={[{ required: true }]}>
                <InputNumber min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bpjs" label="BPJS & Manfaat Kesehatan (Bulanan)" rules={[{ required: true }]}>
                <InputNumber min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bonus" label="Bonus & THR per Orang (Tahunan)" rules={[{ required: true }]}>
                <InputNumber min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => (v ? Number(v.replace(/\./g, '')) : 0) as any} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
