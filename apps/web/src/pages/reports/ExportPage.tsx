import React, { useState } from 'react';
import { Card, Row, Col, Button, Checkbox, Typography, Divider, Alert, Space, Progress, notification } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { MonthlyValues, MONTH_LABELS } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const ExportPage: React.FC = () => {
  const { selectedCycleId, cycles, pnlSnapshot, cashFlowSnapshot, balanceSheetSnapshot } = useAppStore();

  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [includePnl, setIncludePnl] = useState(true);
  const [includeCf, setIncludeCf] = useState(true);
  const [includeBs, setIncludeBs] = useState(true);

  const activeCycle = cycles.find(c => c.id === selectedCycleId);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 0 }).format(val);
  };

  // 1. EXCEL EXPORTER
  const handleExportExcel = () => {
    if (!pnlSnapshot || !cashFlowSnapshot || !balanceSheetSnapshot) return;
    setExcelLoading(true);

    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();

        const buildSheetData = (title: string, data: Record<string, MonthlyValues>) => {
          const rows = [];
          rows.push([title]);
          rows.push([`Tahun Anggaran: RKAP ${activeCycle?.fiscalYear}`]);
          rows.push([]);
          rows.push(['Akun / Deskripsi', ...MONTH_LABELS, 'TOTAL TAHUNAN']);

          Object.entries(data).forEach(([name, values]) => {
            const rowVal = Object.values(values);
            const total = rowVal.reduce((a, b) => a + b, 0);
            rows.push([name, ...rowVal, total]);
          });

          return XLSX.utils.aoa_to_sheet(rows);
        };

        if (includePnl) {
          const pnlData = {
            'Pendapatan Kotor': pnlSnapshot.summary.grossRevenue,
            'Harga Pokok Penjualan (COGS)': pnlSnapshot.summary.cogs,
            'Laba Kotor': pnlSnapshot.summary.grossProfit,
            'Beban Operasional': pnlSnapshot.summary.operatingExpenses,
            'EBITDA': pnlSnapshot.summary.ebitda,
            'Beban Depresiasi': pnlSnapshot.summary.depreciation,
            'Laba Operasional (EBIT)': pnlSnapshot.summary.ebit,
            'Beban Bunga': pnlSnapshot.summary.interestExpense,
            'Laba Sebelum Pajak (EBT)': pnlSnapshot.summary.ebt,
            'Pajak Penghasilan (PPh)': pnlSnapshot.summary.incomeTax,
            'Laba Bersih': pnlSnapshot.summary.netIncome,
          };
          const ws = buildSheetData('PROYEKSI LABA RUGI (P&L)', pnlData);
          XLSX.utils.book_append_sheet(wb, ws, 'Laba Rugi');
        }

        if (includeCf) {
          const op = cashFlowSnapshot.operatingActivities;
          const inv = cashFlowSnapshot.investingActivities;
          const fin = cashFlowSnapshot.financingActivities;

          const cfData = {
            'Laba Bersih': op.netIncome,
            'Penyesuaian Depresiasi': op.depreciationAdj,
            'Perubahan Piutang Usaha': op.receivablesChange,
            'Perubahan Persediaan': op.inventoryChange,
            'Perubahan Utang Usaha': op.payablesChange,
            'Total Kas Aktivitas Operasi': op.totalOperating,
            'Pengeluaran Modal (CapEx)': inv.capex,
            'Penerimaan Disposal': inv.assetDisposal,
            'Total Kas Aktivitas Investasi': inv.totalInvesting,
            'Penerimaan Pinjaman Bank': fin.loanProceeds,
            'Pembayaran Pinjaman': fin.loanRepayments,
            'Pembagian Dividen': fin.dividendsPaid,
            'Total Kas Aktivitas Pendanaan': fin.totalFinancing,
            'Kas Bersih Terbentuk': cashFlowSnapshot.netCashFlow,
            'Kas Awal Bulan': cashFlowSnapshot.openingCash,
            'Kas Akhir Bulan': cashFlowSnapshot.closingCash,
          };
          const ws = buildSheetData('PROYEKSI ARUS KAS (CASH FLOW)', cfData);
          XLSX.utils.book_append_sheet(wb, ws, 'Arus Kas');
        }

        if (includeBs) {
          const ca = balanceSheetSnapshot.currentAssets;
          const nca = balanceSheetSnapshot.nonCurrentAssets;
          const cl = balanceSheetSnapshot.currentLiabilities;
          const ltl = balanceSheetSnapshot.longTermLiabilities;
          const eq = balanceSheetSnapshot.equity;

          const bsData = {
            'Kas & Setara Kas': ca.cashAndEquivalents,
            'Piutang Usaha': ca.accountsReceivable,
            'Persediaan': ca.inventory,
            'Total Aset Lancar': ca.totalCurrentAssets,
            'Aset Tetap Bersih': nca.netFixedAssets,
            'Total Aset Tidak Lancar': nca.totalNonCurrentAssets,
            'TOTAL ASET': balanceSheetSnapshot.totalAssets,
            'Utang Usaha': cl.accountsPayable,
            'Total Liabilitas Jangka Pendek': cl.totalCurrentLiabilities,
            'Total Liabilitas Jangka Panjang': ltl.totalLongTermLiabilities,
            'Total Liabilitas': balanceSheetSnapshot.totalLiabilities,
            'Laba Ditahan': eq.retainedEarnings,
            'Total Ekuitas': eq.totalEquity,
            'TOTAL LIABILITAS DAN EKUITAS': balanceSheetSnapshot.totalLiabilitiesAndEquity,
          };
          const ws = buildSheetData('PROYEKSI NERACA (BALANCE SHEET)', bsData);
          XLSX.utils.book_append_sheet(wb, ws, 'Neraca');
        }

        XLSX.writeFile(wb, `CorPlan_RKAP_${activeCycle?.fiscalYear}.xlsx`);

        notification.success({
          message: 'Ekspor Excel Berhasil',
          description: 'Dokumen RKAP .xlsx telah berhasil diunduh.',
          placement: 'bottomRight',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setExcelLoading(false);
      }
    }, 1000);
  };

  // 2. PDF EXPORTER
  const handleExportPdf = () => {
    if (!pnlSnapshot || !cashFlowSnapshot || !balanceSheetSnapshot) return;
    setPdfLoading(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF('landscape');

        // Cover Page
        doc.setFillColor(11, 15, 26);
        doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');

        doc.setTextColor(16, 185, 129);
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.text('CorPlan', 40, 80);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('Rencana Kerja & Anggaran Perusahaan (RKAP)', 40, 100);

        doc.setFontSize(14);
        doc.setTextColor(156, 163, 175);
        doc.text(`Tahun Anggaran: ${activeCycle?.fiscalYear}`, 40, 120);
        doc.text(`Status Dokumen: ${activeCycle?.status.toUpperCase()}`, 40, 130);
        doc.text(`Tanggal Generate: ${new Date().toLocaleDateString('id-ID')}`, 40, 140);

        const addTablePage = (title: string, headers: string[], rows: any[]) => {
          doc.addPage();
          doc.setFontSize(16);
          doc.setTextColor(11, 15, 26);
          doc.text(title, 14, 20);

          (doc as any).autoTable({
            startY: 28,
            head: [headers],
            body: rows,
            theme: 'striped',
            styles: { fontSize: 8, font: 'courier' },
            headStyles: { fillColor: [16, 185, 129] },
          });
        };

        if (includePnl) {
          const pRows = [
            ['Pendapatan Kotor', ...Object.values(pnlSnapshot.summary.grossRevenue).map(v => formatCurrency(v))],
            ['COGS', ...Object.values(pnlSnapshot.summary.cogs).map(v => formatCurrency(v))],
            ['Laba Kotor', ...Object.values(pnlSnapshot.summary.grossProfit).map(v => formatCurrency(v))],
            ['OpEx', ...Object.values(pnlSnapshot.summary.operatingExpenses).map(v => formatCurrency(v))],
            ['EBITDA', ...Object.values(pnlSnapshot.summary.ebitda).map(v => formatCurrency(v))],
            ['Laba Bersih', ...Object.values(pnlSnapshot.summary.netIncome).map(v => formatCurrency(v))],
          ];
          addTablePage('PROYEKSI LABA RUGI (P&L)', ['Akun', ...MONTH_LABELS], pRows);
        }

        if (includeCf) {
          const op = cashFlowSnapshot.operatingActivities;
          const inv = cashFlowSnapshot.investingActivities;
          const fin = cashFlowSnapshot.financingActivities;

          const cRows = [
            ['Arus Kas Operasional', ...Object.values(op.totalOperating).map(v => formatCurrency(v))],
            ['Arus Kas Investasi', ...Object.values(inv.totalInvesting).map(v => formatCurrency(v))],
            ['Arus Kas Pendanaan', ...Object.values(fin.totalFinancing).map(v => formatCurrency(v))],
            ['Saldo Kas Akhir', ...Object.values(cashFlowSnapshot.closingCash).map(v => formatCurrency(v))],
          ];
          addTablePage('PROYEKSI ARUS KAS (CASH FLOW)', ['Metrik', ...MONTH_LABELS], cRows);
        }

        if (includeBs) {
          const ca = balanceSheetSnapshot.currentAssets;
          const nca = balanceSheetSnapshot.nonCurrentAssets;

          const bRows = [
            ['Total Aset Lancar', ...Object.values(ca.totalCurrentAssets).map(v => formatCurrency(v))],
            ['Total Aset Tidak Lancar', ...Object.values(nca.totalNonCurrentAssets).map(v => formatCurrency(v))],
            ['TOTAL ASET', ...Object.values(balanceSheetSnapshot.totalAssets).map(v => formatCurrency(v))],
            ['Total Liabilitas', ...Object.values(balanceSheetSnapshot.totalLiabilities).map(v => formatCurrency(v))],
            ['Total Ekuitas', ...Object.values(balanceSheetSnapshot.equity.totalEquity).map(v => formatCurrency(v))],
          ];
          addTablePage('PROYEKSI NERACA (BALANCE SHEET)', ['Neraca', ...MONTH_LABELS], bRows);
        }

        doc.save(`CorPlan_RKAP_${activeCycle?.fiscalYear}.pdf`);

        notification.success({
          message: 'Ekspor PDF Berhasil',
          description: 'Dokumen RKAP .pdf telah berhasil diunduh.',
          placement: 'bottomRight',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setPdfLoading(false);
      }
    }, 1200);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>Laporan & Ekspor Dokumen</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Ekspor dokumen RKAP yang terkonsolidasi ke dalam berkas Excel spreadsheet formal atau presentasi PDF.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <FileExcelOutlined style={{ color: '#10B981', fontSize: '20px' }} />
                <span style={{ color: '#fff' }}>Ekspor Excel (.xlsx)</span>
              </Space>
            }
            style={{ height: '100%' }}
          >
            <Paragraph style={{ color: 'rgba(255,255,255,0.45)' }}>
              Menghasilkan berkas spreadsheet multi-sheet berisi formulir tabulasi bulanan lengkap untuk Laba Rugi, Cash Flow, dan Neraca yang siap dianalisis secara manual.
            </Paragraph>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <Checkbox checked={includePnl} onChange={e => setIncludePnl(e.target.checked)}>
                <span style={{ color: '#fff' }}>Masukkan Lembar Proyeksi Laba Rugi (P&L)</span>
              </Checkbox>
              <Checkbox checked={includeCf} onChange={e => setIncludeCf(e.target.checked)}>
                <span style={{ color: '#fff' }}>Masukkan Lembar Proyeksi Arus Kas (Cash Flow)</span>
              </Checkbox>
              <Checkbox checked={includeBs} onChange={e => setIncludeBs(e.target.checked)}>
                <span style={{ color: '#fff' }}>Masukkan Lembar Proyeksi Neraca (Balance Sheet)</span>
              </Checkbox>
            </div>

            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={excelLoading}
              onClick={handleExportExcel}
              style={{ width: '100%' }}
            >
              Unduh File Excel
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <FilePdfOutlined style={{ color: '#EF4444', fontSize: '20px' }} />
                <span style={{ color: '#fff' }}>Ekspor Laporan PDF (.pdf)</span>
              </Space>
            }
            style={{ height: '100%' }}
          >
            <Paragraph style={{ color: 'rgba(255,255,255,0.45)' }}>
              Menghasilkan dokumen PDF formal berpola landscape dilengkapi Cover Perusahaan, Detail Versi, dan tabel-tabel ringkasan laporan keuangan untuk presentasi direksi.
            </Paragraph>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <Checkbox checked={includePnl} onChange={e => setIncludePnl(e.target.checked)}>
                <span style={{ color: '#fff' }}>Termasuk Proyeksi Laba Rugi</span>
              </Checkbox>
              <Checkbox checked={includeCf} onChange={e => setIncludeCf(e.target.checked)}>
                <span style={{ color: '#fff' }}>Termasuk Proyeksi Arus Kas</span>
              </Checkbox>
              <Checkbox checked={includeBs} onChange={e => setIncludeBs(e.target.checked)}>
                <span style={{ color: '#fff' }}>Termasuk Proyeksi Neraca</span>
              </Checkbox>
            </div>

            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={pdfLoading}
              onClick={handleExportPdf}
              style={{ width: '100%', background: 'linear-gradient(135deg, #EF4444, #C084FC) !important' }}
            >
              Unduh Laporan PDF
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
