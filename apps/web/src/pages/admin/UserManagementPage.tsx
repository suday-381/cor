import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, Switch, Tag, Typography, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { User, UserRole, ROLE_LABELS, ROLE_COLORS } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const UserManagementPage: React.FC = () => {
  const { users, addUser, updateUser, departments } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form] = Form.useForm();


  const deptOptions = departments.map(d => ({ value: d.name, label: d.name }));

  const columns = [
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong style={{ color: '#fff' }}>{text}</Text>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Peran',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={ROLE_COLORS[role]}>
          {ROLE_LABELS[role]}
        </Tag>
      )
    },
    {
      title: 'Departemen',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => text || '-'
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Aktif' : 'Nonaktif'}
        </Tag>
      )
    },
    {
      title: 'Aksi',
      key: 'actions',
      render: (_: any, record: User) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingUser(record);
            form.setFieldsValue({
              name: record.name,
              email: record.email,
              role: record.role,
              department: record.department,
              isActive: record.isActive,
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
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleFinish = (values: any) => {
    if (editingUser) {
      updateUser(editingUser.id, values);
    } else {
      addUser({
        ...values,
        isActive: true
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Manajemen User</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Kelola hak akses, penugasan departemen, dan lisensi login pengguna sistem.
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAdd}
        >
          Tambah Pengguna
        </Button>
      </div>

      <Card>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          size="middle"
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Simpan"
        cancelText="Batal"
        width={480}
      >
        <Form
          form={form}
          onFinish={handleFinish}
          layout="vertical"
          initialValues={{ role: 'staff_finance', isActive: true }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Nama Lengkap"
            rules={[{ required: true, message: 'Masukkan nama!' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Alamat Email"
            rules={[
              { required: true, message: 'Masukkan email!' },
              { type: 'email', message: 'Email tidak valid!' }
            ]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="Peran Sistem" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(ROLE_LABELS).map(([role, label]) => ({
                    value: role,
                    label
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Departemen">
                <Select options={deptOptions} dropdownStyle={{ backgroundColor: '#111827' }} allowClear />
              </Form.Item>
            </Col>
          </Row>

          {editingUser && (
            <Form.Item name="isActive" label="Status Aktif" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};
