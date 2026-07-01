import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Switch, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, ClusterOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';

const { Title, Text, Paragraph } = Typography;

export const DepartmentPage: React.FC = () => {
  const { departments, addDepartment, updateDepartment } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const [form] = Form.useForm();


  const columns = [
    {
      title: 'Kode Dept',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string) => <Tag color="blue" className="font-mono">{text}</Tag>
    },
    {
      title: 'Nama Departemen',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong style={{ color: '#fff' }}>{text}</Text>
    },
    {
      title: 'Revenue Center',
      dataIndex: 'isRevenueCenter',
      key: 'isRevenueCenter',
      render: (isRev: boolean) => (
        <Tag color={isRev ? 'success' : 'default'}>
          {isRev ? 'Ya (Penjualan)' : 'Tidak (Operational)'}
        </Tag>
      )
    },
    {
      title: 'Urutan Tampilan',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      align: 'center' as const,
    },
    {
      title: 'Aksi',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingDept(record);
            form.setFieldsValue({
              code: record.code,
              name: record.name,
              isRevenueCenter: record.isRevenueCenter,
              sortOrder: record.sortOrder,
            });
            setIsModalOpen(true);
          }}
        >
          Edit
        </Button>
      )
    }
  ];

  const handleOpenAdd = () => {
    setEditingDept(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleFinish = (values: any) => {
    if (editingDept) {
      updateDepartment(editingDept.id, values);
    } else {
      addDepartment(values);
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Struktur Departemen</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Kelola struktur departemen organisasi dan tentukan departemen penghasil pendapatan (Revenue Center).
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAdd}
        >
          Tambah Departemen
        </Button>
      </div>

      <Card>
        <Table
          dataSource={departments}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title={editingDept ? 'Edit Departemen' : 'Tambah Departemen Baru'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Simpan"
        cancelText="Batal"
        width={400}
      >
        <Form
          form={form}
          onFinish={handleFinish}
          layout="vertical"
          initialValues={{ isRevenueCenter: false, sortOrder: 10 }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="code"
            label="Kode Singkat"
            rules={[{ required: true, message: 'Masukkan kode!' }]}
          >
            <Input placeholder="Contoh: MKT, FIN, HRD" className="font-mono" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Nama Departemen"
            rules={[{ required: true, message: 'Masukkan nama!' }]}
          >
            <Input placeholder="Contoh: Sales & Marketing" />
          </Form.Item>

          <Form.Item name="isRevenueCenter" label="Revenue Center (Menghasilkan Pendapatan)" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="sortOrder" label="Urutan Sortir">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
