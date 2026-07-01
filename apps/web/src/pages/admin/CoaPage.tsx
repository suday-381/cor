import React, { useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, Upload, Tag, Typography, message } from 'antd';
import { PlusOutlined, EditOutlined, UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { AccountType } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const CoaPage: React.FC = () => {
  const { coa, addCoAItem, updateCoAItem } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCoa, setEditingCoa] = useState<any>(null);

  const [form] = Form.useForm();


  const columns = [
    {
      title: 'Nomor Akun (Code)',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (text: string) => <span className="font-mono" style={{ fontWeight: 600, color: '#fff' }}>{text}</span>
    },
    {
      title: 'Nama Akun',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <span style={{ paddingLeft: record.level ? record.level * 12 : 0, color: record.level === 1 ? '#10B981' : '#fff' }}>
          {text}
        </span>
      )
    },
    {
      title: 'Tipe Akun',
      dataIndex: 'accountType',
      key: 'accountType',
      render: (type: string) => {
        let color = 'default';
        if (type === 'revenue') color = 'success';
        if (type === 'expense') color = 'warning';
        if (type === 'asset') color = 'blue';
        if (type === 'liability') color = 'orange';
        if (type === 'equity') color = 'purple';
        return <Tag color={color}>{type.toUpperCase()}</Tag>;
      }
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
      render: (_: any, record: any) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingCoa(record);
            form.setFieldsValue({
              code: record.code,
              name: record.name,
              accountType: record.accountType,
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
    setEditingCoa(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleFinish = (values: any) => {
    if (editingCoa) {
      updateCoAItem(editingCoa.id, values);
    } else {
      addCoAItem({
        ...values,
        level: values.code.length <= 4 ? 1 : 2,
        isActive: true,
      });
    }
    setIsModalOpen(false);
  };

  const handleImportSample = () => {
    message.loading({ content: 'Mengimpor berkas CoA ERP...', key: 'import' });
    setTimeout(() => {
      // Add a couple of accounts
      addCoAItem({ code: '4400', name: 'Penjualan Lisensi SaaS', accountType: 'revenue', level: 2, isActive: true });
      addCoAItem({ code: '6800', name: 'Beban Lisensi Cloud AWS', accountType: 'expense', level: 2, isActive: true });
      message.success({ content: 'Import sukses! 2 akun baru ditambahkan ke CoA.', key: 'import', duration: 3 });
      setIsImportModalOpen(false);
    }, 1500);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Chart of Accounts (CoA)</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Konfigurasi daftar akun terstandardisasi untuk kategori Pendapatan, Biaya, Aset, Liabilitas, dan Ekuitas.
          </Paragraph>
        </div>
        <Space>
          <Button
            type="dashed"
            icon={<UploadOutlined />}
            onClick={() => setIsImportModalOpen(true)}
            style={{ color: '#10B981', borderColor: '#10B981' }}
          >
            Impor dari ERP
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAdd}
          >
            Tambah Akun
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={coa}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      {/* ADD/EDIT COA ITEM MODAL */}
      <Modal
        title={editingCoa ? 'Edit Akun CoA' : 'Tambah Akun CoA Baru'}
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
          initialValues={{ accountType: 'expense', isActive: true }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="code"
            label="Nomor Akun (Account Code)"
            rules={[
              { required: true, message: 'Masukkan nomor akun!' },
              { pattern: /^\d+$/, message: 'Hanya boleh berisi angka!' }
            ]}
          >
            <Input placeholder="Contoh: 6100, 5200" className="font-mono" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Nama Akun"
            rules={[{ required: true, message: 'Masukkan nama akun!' }]}
          >
            <Input placeholder="Contoh: Beban Listrik Kantor" />
          </Form.Item>

          <Form.Item name="accountType" label="Tipe Laporan Posisi" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'revenue', label: 'Pendapatan (Revenue)' },
                { value: 'expense', label: 'Beban (Expense)' },
                { value: 'asset', label: 'Aset (Asset)' },
                { value: 'liability', label: 'Liabilitas (Liability)' },
                { value: 'equity', label: 'Ekuitas (Equity)' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* IMPORT MODAL */}
      <Modal
        title="Impor Chart of Accounts dari ERP"
        open={isImportModalOpen}
        onCancel={() => setIsImportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsImportModalOpen(false)}>Batal</Button>,
          <Button key="import" type="primary" icon={<UploadOutlined />} onClick={handleImportSample}>Mulai Impor</Button>
        ]}
        width={480}
      >
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <FileTextOutlined style={{ fontSize: '48px', color: '#10B981', marginBottom: 12 }} />
          <Paragraph style={{ color: '#fff' }}>
            Unggah file master CoA dari sistem ERP Anda (SAP, Oracle, Accurate, dll) dalam format CSV atau Excel (.xlsx).
          </Paragraph>
          <div style={{ marginTop: 24, padding: '20px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8 }}>
            <Upload showUploadList={false} beforeUpload={() => false}>
              <Button type="dashed" icon={<UploadOutlined />}>Pilih File Laporan CoA (.xlsx / .csv)</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', fontSize: '0.75rem', marginTop: 8 }}>
              Maksimum ukuran file: 5MB. Kolom wajib: Code, Name, Type.
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};
