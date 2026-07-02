import React, { useState, useEffect } from 'react';
import { Card, Space, Steps, Button, Input, List, Avatar, Tag, Typography, Alert, Divider, Row, Col, Modal, Form, Select } from 'antd';
import {
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  CommentOutlined,
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { ROLE_LABELS, ROLE_COLORS, CYCLE_STATUS_LABELS } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const WorkflowPage: React.FC = () => {
  const {
    selectedCycleId,
    cycles,
    workflow,
    currentUser,
    submitWorkflow,
    approveWorkflowStage,
    rejectWorkflowStage,
    loadWorkflow,
    departments,
  } = useAppStore();

  const [selectedDeptId, setSelectedDeptId] = useState<string>(currentUser?.departmentId || 'd-sales');
  const [commentInput, setCommentInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const showDeptSelector = ['cfo', 'finance_manager', 'super_admin'].includes(currentUser?.role || '');

  useEffect(() => {
    if (selectedCycleId) {
      const deptId = selectedDeptId || currentUser?.departmentId || '';
      loadWorkflow(selectedCycleId, deptId);
    }
  }, [selectedCycleId, selectedDeptId, currentUser, loadWorkflow]);

  const getStatusAlert = () => {
    if (!workflow) return null;
    if (workflow.status === 'approved') {
      return (
        <Alert
          message="RKAP Disetujui Sepenuhnya"
          description="Siklus RKAP tahun anggaran ini telah disetujui oleh seluruh jajaran direksi dan dikunci."
          type="success"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      );
    }
    if (workflow.status === 'rejected') {
      return (
        <Alert
          message="RKAP Dikembalikan untuk Revisi"
          description="Terdapat catatan revisi dari peninjau. Harap perbarui anggaran pendapatan/biaya Anda sesuai komentar."
          type="error"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      );
    }
    return (
      <Alert
        message="Siklus Peninjauan Berlangsung"
        description="RKAP sedang diproses oleh tim peninjau keuangan."
        type="info"
        showIcon
        style={{ marginBottom: 24, borderRadius: 12 }}
      />
    );
  };

  const getStepStatus = (status: string) => {
    if (status === 'approved') return 'finish';
    if (status === 'rejected') return 'error';
    if (status === 'pending') return 'wait';
    return 'process';
  };

  const handleApprove = () => {
    approveWorkflowStage(commentInput || 'Disetujui.', selectedDeptId);
    setCommentInput('');
  };

  const handleRejectSubmit = () => {
    if (!rejectReasonInput.trim()) return;
    rejectWorkflowStage(rejectReasonInput, selectedDeptId);
    setRejectReasonInput('');
    setIsRejectModalOpen(false);
  };

  const currentStage = workflow?.stages[workflow.currentStageIndex];
  const isMyTurnToApprove =
    workflow?.status === 'in_progress' &&
    currentStage?.approverRole === currentUser?.role;

  const isOwner = currentUser?.role === 'finance_manager' || currentUser?.role === 'dept_head';
  const isDraftState = activeCycle?.status === 'draft';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Workflow Approval & Persetujuan</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Ajukan RKAP untuk disetujui direksi, lacak progress workflow bertingkat, dan berikan catatan review.
          </Paragraph>
        </div>
        {showDeptSelector && (
          <Space align="center">
            <span style={{ color: '#9CA3AF' }}>Pilih Departemen:</span>
            <Select
              value={selectedDeptId}
              onChange={setSelectedDeptId}
              style={{ width: 220 }}
              dropdownStyle={{ backgroundColor: '#111827' }}
              options={departments.map(d => ({ value: d.id, label: d.name }))}
            />
          </Space>
        )}
      </div>

      {getStatusAlert()}

      <Row gutter={[20, 20]}>
        {/* Stepper progress */}
        <Col xs={24} lg={16}>
          <Card title={<span style={{ color: '#fff' }}>Alur Persetujuan Bertingkat</span>} style={{ marginBottom: 24 }}>
            {workflow && (
              <Steps
                direction="vertical"
                current={workflow.currentStageIndex}
                status={workflow.status === 'rejected' ? 'error' : 'process'}
                items={workflow.stages.map((stg, index) => {
                  const subtitle = stg.decidedAt
                    ? `Diselesaikan pada ${new Date(stg.decidedAt).toLocaleString('id-ID')}`
                    : stg.deadline
                    ? `Batas waktu: ${new Date(stg.deadline).toLocaleDateString('id-ID')}`
                    : '';

                  return {
                    title: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{stg.stageName}</span>
                        <Tag color={ROLE_COLORS[stg.approverRole]}>
                          {ROLE_LABELS[stg.approverRole]}
                        </Tag>
                      </div>
                    ),
                    description: (
                      <div style={{ marginTop: 6, paddingBottom: 16 }}>
                        <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>{subtitle}</Text>
                        {stg.comments.length > 0 && (
                          <div style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6, borderLeft: '3px solid #10B981' }}>
                            {stg.comments.map(c => (
                              <div key={c.id} style={{ marginBottom: 6 }}>
                                <Text strong style={{ color: '#fff', fontSize: '0.85rem' }}>{c.userName}: </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>"{c.content}"</Text>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                    status: getStepStatus(stg.status)
                  };
                })}
              />
            )}
          </Card>

        </Col>

        {/* User actions */}
        <Col xs={24} lg={8}>
          <Card title={<span style={{ color: '#fff' }}>Aksi Persetujuan</span>} style={{ height: '100%' }}>
            {isDraftState && isOwner && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <ExclamationCircleOutlined style={{ fontSize: '40px', color: '#F59E0B', marginBottom: 12 }} />
                <Title level={5} style={{ color: '#fff', margin: 0 }}>Ajukan RKAP Sekarang</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginTop: 8 }}>
                  RKAP 2027 siap diajukan untuk ditinjau oleh CFO dan Direktur Keuangan.
                </Paragraph>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={() => submitWorkflow(selectedDeptId)}
                >
                  Ajukan untuk Review
                </Button>
              </div>
            )}

            {isMyTurnToApprove && (
              <div>
                <Paragraph style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                  Anda bertindak sebagai <Text strong style={{ color: '#fff' }}>{ROLE_LABELS[currentUser?.role || 'viewer']}</Text>. Berikan persetujuan atau kembalikan dokumen untuk direvisi.
                </Paragraph>

                <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.45)' }}>Catatan Persetujuan</span>}>
                  <Input.TextArea
                    rows={3}
                    placeholder="Masukkan komentar persetujuan..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                  />
                </Form.Item>

                <Space direction="vertical" style={{ width: '100%', marginTop: 12 }} size={10}>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    style={{ width: '100%' }}
                    onClick={handleApprove}
                  >
                    Setujui RKAP
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    style={{ width: '100%' }}
                    onClick={() => setIsRejectModalOpen(true)}
                  >
                    Kembalikan untuk Revisi
                  </Button>
                </Space>
              </div>
            )}

            {!isMyTurnToApprove && !isDraftState && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CommentOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }} />
                <Title level={5} style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>Menunggu Giliran Anda</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: 4 }}>
                  Tahap persetujuan saat ini berada pada: <Text strong style={{ color: '#fff' }}>{currentStage?.stageName}</Text>. Anda akan diberitahu ketika giliran Anda tiba.
                </Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* REJECT MODAL */}
      <Modal
        title="Kembalikan Dokumen RKAP untuk Revisi"
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={handleRejectSubmit}
        okText="Kirim Revisi"
        cancelText="Batal"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 12 }}>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)' }}>
            Catatan revisi wajib diisi agar tim Finance Manager dapat menyesuaikan angka anggaran berdasarkan kebutuhan Anda.
          </Paragraph>
          <Form.Item label={<span style={{ color: '#fff' }}>Alasan Pengembalian / Catatan Revisi</span>} required>
            <Input.TextArea
              rows={4}
              placeholder="Misal: Harap pangkas anggaran marketing 10% dan sesuaikan target revenue Q3..."
              value={rejectReasonInput}
              onChange={e => setRejectReasonInput(e.target.value)}
            />
          </Form.Item>
        </div>
      </Modal>
    </div>
  );
};

