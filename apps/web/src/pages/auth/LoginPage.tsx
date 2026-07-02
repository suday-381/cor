import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, Typography, Alert, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined, RightCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { UserRole } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAppStore(state => state.login);
  const users = useAppStore(state => state.users);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; role: UserRole }) => {
    setLoading(true);
    setError(null);

    try {
      const success = await login(values.email, values.role);
      setLoading(false);

      if (success) {
        navigate('/');
      } else {
        setError('Email atau peran tidak valid. Silakan gunakan tombol Masuk Cepat di bawah.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Gagal masuk. Silakan coba lagi.');
    }
  };

  const handleQuickLogin = async (email: string, role: UserRole) => {
    await login(email, role);
    navigate('/');
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div className="login-logo">
          <h1>CorPlan</h1>
          <p>Corporate Financial Planning & RKAP</p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
        )}

        <Form
          name="login_form"
          initialValues={{ email: 'finance@corplan.id', role: 'finance_manager' }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Masukkan email Anda!' },
              { type: 'email', message: 'Format email tidak valid!' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />}
              placeholder="Email Perusahaan"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Peran Pengguna</span>}
            rules={[{ required: true, message: 'Pilih peran Anda!' }]}
          >
            <Select
              dropdownStyle={{ backgroundColor: '#111827' }}
              options={[
                { value: 'super_admin', label: 'Super Admin / IT' },
                { value: 'cfo', label: 'CFO / Direktur Keuangan' },
                { value: 'finance_manager', label: 'Finance Manager' },
                { value: 'dept_head', label: 'Kepala Departemen (Ops/Sales)' },
                { value: 'staff_finance', label: 'Staff Keuangan' },
                { value: 'csp_senior_manager', label: 'CSP Senior Manager (Business Dept)' },
                { value: 'gm_csp_finance', label: 'GM CSP & Finance (Business Dept)' },
                { value: 'viewer', label: 'Viewer (Direksi Non-Fin)' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', marginTop: 12 }}
            >
              Masuk ke Aplikasi
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Uji Coba Journeys (Masuk Cepat)</span>
          </Divider>

          <Row gutter={[8, 8]} justify="center" style={{ marginTop: 12 }}>
            <Col span={12}>
              <Button
                size="small"
                type="dashed"
                style={{ width: '100%', fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('finance@corplan.id', 'finance_manager')}
              >
                1. Finance Mgr
              </Button>
            </Col>
            <Col span={12}>
              <Button
                size="small"
                type="dashed"
                style={{ width: '100%', fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('cfo@corplan.id', 'cfo')}
              >
                2. CFO / Direktur
              </Button>
            </Col>
            <Col span={12}>
              <Button
                size="small"
                type="dashed"
                style={{ width: '100%', fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('sales@corplan.id', 'dept_head')}
              >
                3. Dept. Head (Sales)
              </Button>
            </Col>
            <Col span={12}>
              <Button
                size="small"
                type="dashed"
                style={{ width: '100%', fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('admin@corplan.id', 'super_admin')}
              >
                4. Super Admin
              </Button>
            </Col>
            <Col span={12}>
              <Button
                size="small"
                type="dashed"
                style={{ width: '100%', fontSize: '0.75rem', borderColor: '#EC4899', color: '#EC4899' }}
                onClick={() => handleQuickLogin('csp@corplan.id', 'csp_senior_manager')}
              >
                5. CSP Sr Mgr
              </Button>
            </Col>
            <Col span={12}>
              <Button
                size="small"
                type="dashed"
                style={{ width: '100%', fontSize: '0.75rem', borderColor: '#8B5CF6', color: '#8B5CF6' }}
                onClick={() => handleQuickLogin('gm@corplan.id', 'gm_csp_finance')}
              >
                6. GM CSP & Fin
              </Button>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};


