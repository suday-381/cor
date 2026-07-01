
PRODUCT REQUIREMENTS DOCUMENT

Aplikasi Corporate Financial Planning
RKAP — Rencana Kerja dan Anggaran Perusahaan
Versi Dokumen	v1.0
Tanggal	23 Mei 2026
Status	Draft
Klasifikasi	Internal

 
1. Executive Summary

Dokumen ini merupakan Product Requirements Document (PRD) untuk Aplikasi Corporate Financial Planning yang berfokus pada penyusunan RKAP (Rencana Kerja dan Anggaran Perusahaan). Aplikasi ini dirancang untuk menggantikan proses perencanaan keuangan berbasis spreadsheet yang tidak terstruktur, tidak terintegrasi, dan rentan terhadap kesalahan manual.
Aplikasi ini memungkinkan manajemen perusahaan untuk menyusun target keuangan tahunan secara sistematis, mulai dari anggaran pendapatan dan biaya, proyeksi Cash Flow, hingga proyeksi Balance Sheet — semua dalam satu platform terintegrasi dengan alur kerja approval yang terstandarisasi.

Target Pengguna	Timeline MVP	Platform	Prioritas
Finance & Management	Q3 2026	Web Application	High

 
2. Latar Belakang & Permasalahan

2.1 Kondisi Saat Ini
Proses penyusunan RKAP di sebagian besar perusahaan masih dilakukan secara manual menggunakan Microsoft Excel atau Google Sheets. Kondisi ini menimbulkan berbagai permasalahan operasional dan strategis:
•	Proses konsolidasi data dari berbagai departemen membutuhkan waktu berminggu-minggu
•	Tidak ada single source of truth — terdapat banyak versi file yang beredar secara bersamaan
•	Tidak ada audit trail yang jelas mengenai siapa yang mengubah angka dan kapan
•	Proses approval tidak terstruktur — hanya via email atau verbal
•	Perubahan asumsi makro (inflasi, kurs, suku bunga) sulit dipropagasikan ke seluruh model
•	Integrasi antara P&L, Cash Flow, dan Balance Sheet dilakukan secara manual dan rawan error
•	Tidak ada kemampuan analisis skenario (scenario planning) secara real-time
2.2 Dampak Bisnis
Area Dampak	Masalah	Estimasi Kerugian
Waktu & Produktivitas	Konsolidasi manual memakan 3-4 minggu	~200 jam/tahun per tim finance
Akurasi Data	Error formula Excel tidak terdeteksi	Risiko restatement laporan keuangan
Governance	Tidak ada jejak audit perubahan	Risiko kepatuhan dan audit eksternal
Pengambilan Keputusan	Data tidak real-time dan tidak terintegrasi	Keputusan strategis terlambat atau tidak akurat

 
3. Tujuan & Sasaran Produk

3.1 Tujuan Utama
1.	Menyediakan platform terpusat untuk penyusunan RKAP yang terintegrasi antara target revenue, biaya operasional, Cash Flow, dan Balance Sheet.
2.	Mengotomatiskan kalkulasi keuangan sehingga perubahan pada satu variabel secara otomatis ter-propagasi ke seluruh laporan turunan.
3.	Mengimplementasikan alur kerja (workflow) persetujuan RKAP yang terstruktur dan terdokumentasi.
4.	Menyediakan kemampuan analisis skenario untuk mendukung pengambilan keputusan strategis.
5.	Memastikan audit trail lengkap atas setiap perubahan data dalam sistem.
3.2 Key Performance Indicators (KPI) Produk
Metrik	Baseline	Target 6 Bulan	Target 12 Bulan
Waktu penyusunan RKAP	3-4 minggu	1-2 minggu	< 1 minggu
Tingkat adopsi pengguna	0%	70%	90%
Siklus approval RKAP	Tidak terstruktur	< 5 hari kerja	< 3 hari kerja
Akurasi integrasi P&L-CF-BS	Manual / rawan error	99%	99.9%
User Satisfaction Score (CSAT)	N/A	≥ 4.0/5.0	≥ 4.5/5.0

 
4. Target Pengguna & User Persona

4.1 Segmentasi Pengguna
Peran	Jabatan	Tanggung Jawab Utama	Hak Akses
Super Admin	IT / System Admin	Konfigurasi sistem, manajemen user, master data	Full access — semua modul termasuk konfigurasi
CFO / Direktur	CFO, Direktur Keuangan	Review final, approval RKAP, analisis skenario	Read all, approve/reject, scenario planning
Finance Manager	Manajer Keuangan, Controller	Konsolidasi RKAP, review departemen, finalisasi model	Create/edit RKAP, approve departemen, view semua
Dept. Head	Kepala Departemen	Input anggaran departemen, review dan submit	Edit anggaran dept. sendiri, view konsolidasi
Staff Finance	Staf Keuangan, Budget Analyst	Input data, bantu penyusunan model, generate laporan	Edit data yang ditugaskan, view laporan
Viewer	Direktur Non-Keuangan, Komisaris	Review RKAP final yang telah disetujui	Read-only — RKAP yang sudah di-approve

4.2 User Journey Utama
Alur kerja utama penyusunan RKAP melibatkan beberapa tahapan yang saling berkaitan:
6.	Finance Manager membuka siklus RKAP baru untuk tahun anggaran yang dituju dan mengkonfigurasi asumsi makro (inflasi, kurs, suku bunga, pertumbuhan industri).
7.	Setiap Kepala Departemen menerima notifikasi untuk mengisi anggaran departemennya — termasuk target revenue (jika revenue center), rencana biaya, dan rencana investasi/capex.
8.	Staff Finance membantu input data dan memvalidasi kelengkapan isian setiap departemen.
9.	Finance Manager melakukan konsolidasi seluruh input departemen, merekonsiliasi, dan membangun model Cash Flow serta Balance Sheet secara otomatis dari input yang ada.
10.	CFO melakukan review menyeluruh, menjalankan simulasi skenario, dan memberikan approval atau pengembalian untuk revisi.
11.	RKAP yang disetujui dipublikasikan dan dapat diakses oleh seluruh pemangku kepentingan sesuai hak akses masing-masing.
 
5. Fitur & Fungsionalitas Produk

5.1 Modul 1 — Manajemen Siklus RKAP
Fitur Kunci Modul 1

•	Pembuatan siklus RKAP baru per tahun anggaran dengan periode (tahunan, kuartalan, bulanan)
•	Konfigurasi asumsi makroekonomi global: inflasi, kurs USD/IDR, suku bunga BI, harga komoditas
•	Template RKAP yang dapat dikustomisasi sesuai struktur organisasi perusahaan
•	Pengelolaan status siklus: Draft → In Review → Approved → Published → Locked
•	Versioning — setiap revisi RKAP tersimpan dengan riwayat perubahan lengkap
•	Kemampuan copy RKAP tahun sebelumnya sebagai baseline untuk tahun berikutnya
•	Notifikasi otomatis via email dan in-app kepada seluruh stakeholder terkait
5.2 Modul 2 — Anggaran Pendapatan (Revenue Budget)
Fitur Kunci Modul 2

•	Input target revenue per segmen bisnis, produk/layanan, dan wilayah/channel
•	Breakdown bulanan dengan kemampuan distribusi otomatis berdasarkan pola historis atau manual
•	Penetapan asumsi volume, harga jual, dan diskon per kategori produk
•	Pendukung multi-currency dengan konversi otomatis berdasarkan asumsi kurs yang telah dikonfigurasi
•	Perbandingan target vs aktual tahun sebelumnya (year-over-year analysis)
•	Grafik dan visualisasi tren revenue secara otomatis
5.3 Modul 3 — Anggaran Biaya (Cost Budget / OpEx)
Fitur Kunci Modul 3

•	Struktur biaya berdasarkan Chart of Account (CoA) yang dapat dikonfigurasi
•	Input biaya per departemen dengan kategorisasi: biaya tetap, biaya variabel, biaya semi-variabel
•	Driver-based budgeting — biaya variabel dihitung otomatis berdasarkan driver volume tertentu
•	Pengelolaan biaya lintas departemen (shared cost allocation) dengan metode alokasi yang dapat dipilih
•	Input rencana biaya personalia (headcount plan): jumlah karyawan, gaji, tunjangan, BPJS
•	Pengelolaan anggaran perjalanan dinas, marketing, dan biaya operasional lainnya
5.4 Modul 4 — Anggaran Investasi (CapEx Budget)
Fitur Kunci Modul 4

•	Pengajuan dan persetujuan rencana investasi/pembelian aset per departemen
•	Input detail aset: nama, kategori, nilai, umur ekonomis, metode depresiasi, jadwal pengadaan
•	Kalkulasi otomatis depresiasi bulanan dan akumulasi depresiasi
•	Integrasi otomatis CapEx ke dalam proyeksi Cash Flow (pembayaran) dan Balance Sheet (nilai buku aset)
•	Pengelolaan disposal/penjualan aset yang sudah ada
 
5.5 Modul 5 — Proyeksi Laba Rugi (P&L Projection)
Fitur Kunci Modul 5

•	Konsolidasi otomatis seluruh input revenue dan biaya menjadi Proyeksi P&L
•	Tampilan P&L per bulan, kuartal, dan tahunan (YTD)
•	Kalkulasi otomatis: Gross Profit, EBITDA, EBIT, EBT, Net Income
•	Breakdown P&L per departemen, divisi, dan konsolidasi perusahaan
•	Kalkulasi pajak penghasilan otomatis berdasarkan tarif yang dikonfigurasi
•	Tampilan multi-level: summary, departemen, dan detail akun
5.6 Modul 6 — Proyeksi Arus Kas (Cash Flow Projection)
Ini adalah salah satu modul inti yang membedakan aplikasi ini dari sekedar alat budgeting biasa. Cash Flow dibangun secara otomatis dari P&L dan asumsi modal kerja, namun juga dapat diedit secara manual.
Fitur Kunci Modul 6

•	Proyeksi Cash Flow bulanan menggunakan metode tidak langsung (indirect method) maupun langsung (direct method)
•	Cash Flow dari Aktivitas Operasi (Operating Activities):
◦	Konversi otomatis Net Income ke Cash dengan penyesuaian non-cash items (depresiasi, amortisasi)
◦	Proyeksi perubahan modal kerja: piutang usaha, persediaan, utang usaha, accruals
◦	Asumsi Days Sales Outstanding (DSO), Days Inventory Outstanding (DIO), Days Payable Outstanding (DPO)
•	Cash Flow dari Aktivitas Investasi (Investing Activities):
◦	Integrasi otomatis dari CapEx Budget
◦	Rencana penerimaan dari disposal aset
◦	Rencana investasi keuangan jangka pendek dan panjang
•	Cash Flow dari Aktivitas Pendanaan (Financing Activities):
◦	Rencana penerimaan dan pembayaran pinjaman bank
◦	Rencana penerbitan saham atau pembagian dividen
•	Proyeksi saldo kas akhir periode dengan early warning jika saldo kas proyeksi negatif
•	Visualisasi waterfall chart arus kas bulanan
5.7 Modul 7 — Proyeksi Neraca (Balance Sheet Projection)
Balance Sheet dibangun secara otomatis dari P&L dan Cash Flow, memastikan persamaan akuntansi Aset = Liabilitas + Ekuitas selalu terpenuhi.
Fitur Kunci Modul 7

•	Proyeksi Balance Sheet per akhir bulan dan akhir tahun
•	Aset Lancar: Kas & Setara Kas (dari Cash Flow), Piutang (dari DSO), Persediaan (dari DIO), Prepaid
•	Aset Tidak Lancar: Aset Tetap (dari CapEx - Depresiasi), Investasi Jangka Panjang, Aset Lainnya
•	Liabilitas Jangka Pendek: Utang Usaha (dari DPO), Utang Pajak, Akrual Biaya, Utang Bank Jangka Pendek
•	Liabilitas Jangka Panjang: Utang Bank Jangka Panjang, Obligasi, Liabilitas Imbalan Kerja
•	Ekuitas: Modal Saham, Retained Earnings (dari akumulasi Net Income - Dividen), Cadangan
•	Validasi otomatis: sistem memperingatkan jika Balance Sheet tidak balance
•	Kalkulasi rasio keuangan utama secara otomatis: Current Ratio, D/E Ratio, ROE, ROA, DSCR
 
5.8 Modul 8 — Analisis Skenario & Sensitivitas
Fitur Kunci Modul 8

•	Pembuatan hingga 5 skenario paralel (Base Case, Bull Case, Bear Case, dan skenario kustom)
•	Modifikasi asumsi makro dan operasional per skenario tanpa mengubah skenario lain
•	Perbandingan side-by-side seluruh skenario dalam satu layar
•	Analisis sensitivitas: impact perubahan 1 variabel terhadap Net Income, EBITDA, dan Cash Flow
•	Tornado chart untuk menampilkan variabel dengan dampak terbesar
•	Monte Carlo simulation dasar untuk pemodelan ketidakpastian (opsional, fase 2)
5.9 Modul 9 — Workflow Persetujuan
Fitur Kunci Modul 9

•	Alur persetujuan bertingkat yang dapat dikonfigurasi (N level approval)
•	Notifikasi otomatis kepada approver berikutnya setelah setiap tahap disetujui
•	Kemampuan memberikan komentar dan catatan revisi pada setiap item anggaran
•	Pengembalian (rejection) untuk revisi dengan catatan wajib dari approver
•	Dashboard monitoring status persetujuan untuk Finance Manager dan CFO
•	Deadline dan eskalasi otomatis jika approval tidak dilakukan dalam batas waktu
•	Digital signature (e-sign) pada dokumen RKAP final yang disetujui
5.10 Modul 10 — Pelaporan & Ekspor
Fitur Kunci Modul 10

•	Dashboard eksekutif dengan KPI utama, grafik tren, dan highlight variance
•	Report builder: kustomisasi laporan sesuai kebutuhan (drag-and-drop kolom dan filter)
•	Ekspor laporan ke format Excel (.xlsx), PDF, dan PowerPoint
•	Template laporan yang dapat disimpan dan digunakan ulang
•	Scheduled reporting: pengiriman laporan otomatis via email sesuai jadwal
•	API untuk integrasi ke sistem BI (Business Intelligence) eksternal
 
6. Persyaratan Non-Fungsional

6.1 Keamanan (Security)
•	Autentikasi menggunakan Single Sign-On (SSO) dengan integrasi Active Directory / LDAP
•	Multi-Factor Authentication (MFA) wajib untuk peran Finance Manager ke atas
•	Enkripsi data at-rest menggunakan AES-256 dan data in-transit menggunakan TLS 1.3
•	Role-Based Access Control (RBAC) yang granular hingga level field data tertentu
•	Audit log lengkap untuk setiap operasi Create, Read, Update, Delete (CRUD)
•	Session timeout otomatis setelah 30 menit tidak aktif
•	Pemisahan environment: Development, Staging, dan Production
•	Penetration testing wajib dilakukan sebelum go-live dan secara berkala (minimal 1x per tahun)
6.2 Performa (Performance)
Metrik	Target	Kondisi
Page Load Time	< 2 detik	Koneksi 10 Mbps, 50 concurrent users
Waktu kalkulasi P&L	< 3 detik	Model dengan 500+ line items
Waktu generate laporan	< 10 detik	Laporan tahunan 12 bulan full detail
API Response Time	< 500ms (p95)	Semua endpoint utama
Uptime SLA	99.5% / bulan	Jam kerja 07.00 – 22.00 WIB

6.3 Skalabilitas
•	Arsitektur cloud-native yang dapat discale secara horizontal
•	Mendukung hingga 500 concurrent users tanpa degradasi performa signifikan
•	Database dapat menampung data RKAP hingga 10 tahun ke belakang
•	Arsitektur microservices untuk modul kritis (kalkulasi, pelaporan) agar dapat di-scale secara independen
6.4 Ketersediaan & Pemulihan Bencana
•	Backup database otomatis harian (point-in-time recovery hingga 30 hari)
•	Recovery Time Objective (RTO): < 4 jam
•	Recovery Point Objective (RPO): < 1 jam
•	Disaster Recovery Plan (DRP) yang terdokumentasi dan diuji setiap 6 bulan
 
7. Arsitektur Teknis (High-Level)

7.1 Stack Teknologi yang Direkomendasikan
Layer	Teknologi	Justifikasi
Frontend	React.js + TypeScript, Ant Design / MUI	Ekosistem mature, komponen tabel dan form yang kaya untuk aplikasi enterprise
Backend API	Node.js (NestJS) atau Python (FastAPI)	High performance, ekosistem finansial yang baik, dukungan async processing
Kalkulasi Engine	Python (NumPy, Pandas) — dedicated service	Python unggul untuk komputasi numerik dan model keuangan yang kompleks
Database	PostgreSQL (transaksional) + Redis (cache)	ACID compliance untuk data keuangan, Redis untuk caching kalkulasi berat
Infrastruktur	AWS / GCP / Azure (atau on-premise Kubernetes)	Fleksibilitas deployment sesuai kebijakan keamanan data perusahaan
Antrian & Async	RabbitMQ / Apache Kafka	Untuk pemrosesan kalkulasi berat dan notifikasi secara asynchronous

7.2 Integrasi Eksternal
•	ERP/Accounting System (SAP, Oracle, Accurate): impor data aktual untuk perbandingan vs RKAP via API atau flat file (CSV/Excel)
•	Active Directory / LDAP: sinkronisasi user dan grup untuk autentikasi SSO
•	Email Server (SMTP/SendGrid): pengiriman notifikasi dan laporan terjadwal
•	BI Tools (Power BI, Tableau): ekspor data via API untuk visualisasi lanjutan
•	E-Signature Platform (opsional): integrasi dengan platform tanda tangan digital untuk approval formal
 
8. Prioritas Fitur & Product Roadmap

8.1 Framework Prioritasi (MoSCoW)
Prioritas	Fitur	Fase
Must Have	Manajemen Siklus RKAP, Anggaran Revenue & Biaya, Proyeksi P&L, Cash Flow (indirect), Balance Sheet dasar, Workflow Approval, Ekspor Excel/PDF	MVP — Fase 1 (Q3 2026)
Should Have	CapEx Budget & Depresiasi, Dashboard Eksekutif, Analisis Skenario (3 skenario), Notifikasi & Eskalasi, Multi-currency	Fase 2 (Q4 2026)
Could Have	Cash Flow (direct method), Driver-based budgeting, Analisis Sensitivitas & Tornado Chart, Report Builder kustom, API Integrasi ERP, Scheduled Reporting	Fase 3 (Q1 2027)
Won't Have (Now)	Monte Carlo Simulation, Mobile App Native, AI-powered forecasting, Integrasi pasar modal real-time	Future Backlog

8.2 Timeline Roadmap
Fase 1 — MVP	Fase 2 — Enhanced	Fase 3 — Advanced	Fase 4 — Scale
Q3 2026 (3 bulan)	Q4 2026 (3 bulan)	Q1 2027 (3 bulan)	Q2 2027+ (ongoing)
Core RKAP module, P&L, Cash Flow (indirect), Balance Sheet dasar, Approval workflow, Export Excel/PDF	CapEx & Depreciation, Exec Dashboard, 3-scenario planning, Multi-currency, Notification system	Direct CF, Driver-based budgeting, Sensitivity analysis, Report builder, ERP integration API	AI Forecasting, Mobile support, Advanced analytics, Performance optimization, Enterprise SSO

 
9. Asumsi & Ketergantungan

9.1 Asumsi
12.	Perusahaan klien memiliki Chart of Account (CoA) yang telah terstandardisasi dan dapat diekspor ke format yang dapat diimpor sistem.
13.	Tersedia tim IT internal atau vendor yang dapat mengelola infrastruktur server (jika deployment on-premise).
14.	Pengguna memiliki akses perangkat dengan browser modern (Chrome, Firefox, Edge versi terbaru) dan koneksi internet yang stabil.
15.	Data histori keuangan tersedia minimal 2 tahun ke belakang untuk digunakan sebagai baseline RKAP awal.
16.	Manajemen perusahaan berkomitmen untuk mengadopsi sistem ini dan mendorong perubahan proses dari Excel ke platform digital.
9.2 Ketergantungan
•	Ketersediaan dan kualitas data master dari sistem ERP/Accounting eksisting
•	Kesiapan infrastruktur IT (server, jaringan, keamanan) dari sisi klien
•	Ketersediaan tim SME (Subject Matter Expert) keuangan dari sisi klien selama proses requirement gathering dan UAT
•	Vendor third-party untuk e-signature (jika fitur ini diaktifkan)
 
10. Risiko & Mitigasi

#	Risiko	Likelihood	Impact	Strategi Mitigasi	Owner
1	Resistensi adopsi dari pengguna yang terbiasa dengan Excel	Tinggi	Tinggi	Change management program, pelatihan intensif, demo manfaat konkret, libatkan champion dari setiap departemen	Product + HR
2	Kompleksitas integrasi dengan sistem ERP yang beragam	Tinggi	Sedang	Desain API yang fleksibel, fallback ke impor flat file, dedikasikan sprint khusus untuk setiap integrasi	Engineering
3	Scope creep — permintaan fitur tambahan di luar MVP	Tinggi	Sedang	Proses change request yang formal, backlog management ketat, komunikasi roadmap secara transparan kepada stakeholder	Product Manager
4	Akurasi model kalkulasi keuangan yang kompleks	Sedang	Sangat Tinggi	Validasi formula bersama CFO dan Finance Manager, unit test komprehensif, UAT dengan data historis nyata	Engineering + Finance SME
5	Keamanan dan kebocoran data keuangan yang sensitif	Rendah	Sangat Tinggi	Implementasi enkripsi end-to-end, penetration testing, audit keamanan berkala, SLA keamanan dalam kontrak	Security + Engineering

 
11. Kriteria Keberhasilan & Definisi Done

11.1 Kriteria Keberhasilan Go-Live (MVP)
17.	Seluruh fitur Must Have telah selesai dikembangkan dan lulus UAT (User Acceptance Testing) dengan tingkat bug severity Critical/High = 0.
18.	Setidaknya 1 siklus RKAP penuh (dari input hingga approval) dapat diselesaikan dalam sistem oleh tim keuangan pilot.
19.	Waktu penyusunan RKAP pilot berkurang minimal 40% dibandingkan proses manual sebelumnya.
20.	Tidak ada data keuangan yang hilang atau tidak akurat selama proses migrasi data awal.
21.	Seluruh pengguna inti (Finance Manager, CFO, Dept. Head) telah menyelesaikan pelatihan dan mampu menggunakan sistem secara mandiri.
22.	Dokumentasi teknis (API docs, deployment guide) dan dokumentasi pengguna (user manual) telah lengkap.
11.2 Metrik Evaluasi 3 Bulan Pasca Go-Live
•	Tingkat adopsi: ≥ 80% siklus RKAP aktif menggunakan sistem (bukan Excel)
•	User satisfaction: CSAT score ≥ 4.0/5.0 dari survey pengguna
•	Zero data integrity incident: tidak ada laporan inkonsistensi antara P&L, Cash Flow, dan Balance Sheet
•	Uptime sistem: ≥ 99.5% selama jam kerja operasional
 
12. Glosarium

Istilah	Definisi
RKAP	Rencana Kerja dan Anggaran Perusahaan — dokumen perencanaan keuangan dan operasional tahunan suatu perusahaan.
CapEx	Capital Expenditure — pengeluaran untuk pengadaan atau peningkatan aset tetap yang memberikan manfaat lebih dari satu tahun.
OpEx	Operational Expenditure — pengeluaran untuk biaya operasional rutin yang dikonsumsi dalam satu periode akuntansi.
P&L / Laba Rugi	Profit & Loss Statement — laporan yang menunjukkan pendapatan, biaya, dan laba/rugi perusahaan selama satu periode.
Cash Flow	Laporan Arus Kas — laporan yang menunjukkan aliran masuk dan keluar kas dari aktivitas operasi, investasi, dan pendanaan.
Balance Sheet / Neraca	Laporan posisi keuangan pada satu titik waktu yang menunjukkan aset, liabilitas, dan ekuitas perusahaan.
EBITDA	Earnings Before Interest, Taxes, Depreciation & Amortization — ukuran profitabilitas operasional sebelum item non-kas.
DSO	Days Sales Outstanding — rata-rata hari yang dibutuhkan perusahaan untuk menagih piutang dari pelanggan.
DIO	Days Inventory Outstanding — rata-rata hari persediaan tersimpan sebelum terjual.
DPO	Days Payable Outstanding — rata-rata hari perusahaan membayar utang kepada pemasok.
RBAC	Role-Based Access Control — sistem kontrol akses berdasarkan peran pengguna dalam organisasi.
SSO	Single Sign-On — mekanisme autentikasi yang memungkinkan pengguna login sekali untuk mengakses multiple aplikasi.
DSCR	Debt Service Coverage Ratio — rasio kemampuan perusahaan membayar kewajiban utangnya dari arus kas operasional.
CoA	Chart of Account — daftar akun keuangan yang digunakan oleh perusahaan untuk mencatat transaksi keuangan.
UAT	User Acceptance Testing — pengujian akhir oleh pengguna untuk memverifikasi bahwa sistem memenuhi kebutuhan bisnis.

 
Persetujuan Dokumen

Dokumen PRD ini telah ditinjau dan disetujui oleh pihak-pihak berikut:

Nama & Jabatan	Tanda Tangan	Tanggal
Product Manager / Author		
CFO / Business Owner		
Engineering Lead		
Head of Finance (Key User)		

— End of Document —
