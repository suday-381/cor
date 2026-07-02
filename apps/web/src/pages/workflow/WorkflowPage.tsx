import React, { useState, useEffect } from 'react';
import { Card, Space, Steps, Button, Input, Tag, Typography, Alert, Row, Col, Modal, Form, Select } from 'antd';
import {
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  CommentOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';

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
    reviseWorkflow,
    loadWorkflow,
    departments,
  } = useAppStore();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [commentInput, setCommentInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const showDeptSelector = ['cfo', 'csp', 'super_admin'].includes(currentUser?.role || '');

  // Get parent divisions
  const divisions = departments.filter(d => !d.parentId);

  useEffect(() => {
    if (selectedCycleId && departments.length > 0) {
      const isGlobalSelector = ['cfo', 'csp', 'super_admin'].includes(currentUser?.role || '');
      if (isGlobalSelector) {
        const activeDeptId = selectedDeptId && divisions.some(d => d.id === selectedDeptId)
          ? selectedDeptId
          : divisions[0]?.id || '';
        if (activeDeptId) {
          if (activeDeptId !== selectedDeptId) {
            setSelectedDeptId(activeDeptId);
          }
          loadWorkflow(selectedCycleId, activeDeptId);
        }
      } else {
        const userDept = departments.find(d => d.id === currentUser?.departmentId);
        const userDivId = userDept?.parentId || userDept?.id || '';
        if (userDivId) {
          loadWorkflow(selectedCycleId, userDivId);
        }
      }
    }
  }, [selectedCycleId, selectedDeptId, currentUser, departments, loadWorkflow]);

  const getStatusAlert = () => {
    if (!workflow) return null;
    const docStatus = (workflow as any).documentStatus || 'Draft';
    if (docStatus === 'Approve') {
      return (
        <Alert
          message="RKAP Disetujui Sepenuhnya"
          description="Siklus RKAP divisi ini telah disetujui oleh Corporate Strategic Planning dan diintegrasikan ke proyeksi Global."
          type="success"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      );
    }
    if (docStatus === 'Reject') {
      return (
        <Alert
          message="RKAP Dikembalikan untuk Revisi"
          description="Terdapat catatan revisi dari peninjau. Harap klik 'Buat Draft Revisi' di sebelah kanan untuk mulai mengedit kembali."
          type="error"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      );
    }
    if (docStatus === 'In Review GM') {
      return (
        <Alert
          message="Siklus Peninjauan GM"
          description="RKAP telah diajukan dan sedang menanti peninjauan/persetujuan oleh General Manager Divisi."
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      );
    }
    if (docStatus === 'In Review CSP') {
      return (
        <Alert
          message="Siklus Peninjauan CSP"
          description="GM Divisi telah menyetujui. Dokumen saat ini sedang ditinjau oleh Departemen Corporate Strategic Planning (CSP) untuk persetujuan akhir."
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      );
    }
    return (
      <Alert
        message="Siklus Penyusunan Anggaran"
        description="RKAP dalam status Draft dan masih dapat diedit oleh Budget Owner divisi/departemen terkait."
        type="warning"
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
    const activeDeptId = showDeptSelector ? selectedDeptId : (departments.find(d => d.id === currentUser?.departmentId)?.parentId || currentUser?.departmentId);
    approveWorkflowStage(commentInput || 'Disetujui.', activeDeptId);
    setCommentInput('');
  };

  const handleRejectSubmit = () => {
    if (!rejectReasonInput.trim()) return;
    const activeDeptId = showDeptSelector ? selectedDeptId : (departments.find(d => d.id === currentUser?.departmentId)?.parentId || currentUser?.departmentId);
    rejectWorkflowStage(rejectReasonInput, activeDeptId);
    setRejectReasonInput('');
    setIsRejectModalOpen(false);
  };

  const currentStage = workflow?.stages?.[workflow.currentStageIndex];
  const isMyTurnToApprove =
    workflow?.status === 'in_progress' &&
    currentStage?.approverRole === currentUser?.role;

  const isOwner = currentUser?.role === 'budget_owner' || currentUser?.role === 'super_admin';
  const isDraftState = (workflow as any).documentStatus === 'Draft' || !workflow || workflow.status === 'pending';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Workflow Approval & Persetujuan</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Ajukan RKAP untuk disetujui divisi, lacak progress workflow bertingkat, dan berikan catatan review.
          </Paragraph>
        </div>
        {showDeptSelector && (
          <Space align="center">
            <span style={{ color: '#9CA3AF' }}>Pilih Divisi:</span>
            <Select
              value={selectedDeptId}
              onChange={setSelectedDeptId}
              style={{ width: 260 }}
              dropdownStyle={{ backgroundColor: '#111827' }}
              options={divisions.map(d => ({ value: d.id, label: d.name }))}
            />
          </Space>
        )}
      </div>

      {getStatusAlert()}

      <Row gutter={[20, 20]}>
        {/* Stepper progress */}
        <Col xs={24} lg={16}>
          <Card title={<span style={{ color: '#fff' }}>Alur Persetujuan Bertingkat Divisi</span>} style={{ marginBottom: 24 }}>
            {workflow && workflow.stages && (
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
                        {stg.comments && stg.comments.length > 0 && (
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
                  RKAP divisi Anda siap diajukan untuk ditinjau oleh General Manager Divisi dan CSP.
                </Paragraph>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={() => submitWorkflow(showDeptSelector ? selectedDeptId : undefined)}
                >
                  Ajukan untuk Review GM
                </Button>
              </div>
            )}

            {workflow?.status === 'rejected' && isOwner && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <ExclamationCircleOutlined style={{ fontSize: '40px', color: '#EF4444', marginBottom: 12 }} />
                <Title level={5} style={{ color: '#fff', margin: 0 }}>Revisi Anggaran</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginTop: 8 }}>
                  Silakan buat draft revisi baru berdasarkan catatan penolakan di sebelah kiri. Data lama Anda akan tetap dipertahankan sebagai basis edit.
                </Paragraph>
                <Button
                  type="primary"
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={() => reviseWorkflow(showDeptSelector ? selectedDeptId : undefined)}
                >
                  Buat Draft Revisi
                </Button>
              </div>
            )}

            {isMyTurnToApprove && (
              <div>
                <Paragraph style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                  Anda bertindak sebagai <Text strong style={{ color: '#fff' }}>{ROLE_LABELS[currentUser?.role || 'viewer']}</Text>. Berikan persetujuan atau kembalikan dokumen untuk direvisi.
                </Paragraph>

                <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.45)' }}>Catatan Persetujuan/Penolakan</span>}>
                  <Input.TextArea
                    rows={3}
                    placeholder="Masukkan komentar..."
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
                    onClick={() => {
                      if (!commentInput.trim()) {
                        Modal.error({ title: 'Catatan Wajib Diisi', content: 'Silakan isi kolom catatan di atas sebagai umpan balik penolakan.' });
                        return;
                      }
                      setRejectReasonInput(commentInput);
                      setIsRejectModalOpen(true);
                    }}
                  >
                    Kembalikan untuk Revisi
                  </Button>
                </Space>
              </div>
            )}

            {!isMyTurnToApprove && !isDraftState && workflow?.status !== 'rejected' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CommentOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }} />
                <Title level={5} style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>Menunggu Giliran Anda</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: 4 }}>
                  Tahap persetujuan saat ini berada pada: <Text strong style={{ color: '#fff' }}>{currentStage?.stageName}</Text>. Anda akan dapat memproses dokumen setelah tahap ini dialihkan ke Anda.
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
            Catatan revisi wajib dikirimkan agar tim penyusun divisi dapat menyesuaikan target berdasarkan catatan Anda.
          </Paragraph>
          <Form.Item label={<span style={{ color: '#fff' }}>Alasan Pengembalian / Catatan Revisi</span>} required>
            <Input.TextArea
              rows={4}
              placeholder="Masukan catatan revisi..."
              value={rejectReasonInput}
              disabled
            />
          </Form.Item>
        </div>
      </Modal>
    </div>
  );
};
