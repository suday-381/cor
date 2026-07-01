# CorPlan — Aplikasi Corporate Financial Planning & RKAP

Aplikasi web modern untuk perencanaan keuangan korporasi dan penyusunan target tahunan **RKAP (Rencana Kerja dan Anggaran Perusahaan)**. Proyek ini diimplementasikan menggunakan React 18, TypeScript, dan Ant Design 5 (Enterprise Dark Theme).

## Fitur Utama MVP (Fase 1)

1.  **Manajemen Siklus RKAP (Modul 1)**: Pembuatan siklus tahunan, pengaturan parameter makroekonomi global (inflasi, kurs USD/IDR, BI Rate), dan versioning riwayat revisi.
2.  **Anggaran Pendapatan (Modul 2)**: Penyusunan rencana pendapatan produk/layanan berdasarkan segmen dan channel, dilengkapi grid spreadsheet bulanan dan alat bantu distribusi target.
3.  **Anggaran Biaya & Personalia (Modul 3)**: Alokasi anggaran biaya per departemen (biaya tetap/variabel/semi-variabel) dan modul perencanaan rekrutmen staf (headcount planning).
4.  **Proyeksi Laba Rugi (Modul 5)**: Konsolidasi otomatis seluruh input target pendapatan dan beban operasional bulanan secara real-time.
5.  **Proyeksi Arus Kas (Modul 6)**: Laporan arus kas metode tidak langsung (indirect) dari laba bersih, penyesuaian modal kerja (DSO, DIO, DPO), investasi (CapEx), pendanaan (pinjaman, dividen), dilengkapi warning sistem saldo kas negatif.
6.  **Proyeksi Neraca (Modul 7)**: Laporan posisi keuangan lengkap dengan validasi persamaan dasar akuntansi (Aset = Liabilitas + Ekuitas) dan rasio keuangan (Current Ratio, D/E, ROE, ROA).
7.  **Workflow Persetujuan (Modul 9)**: Stepper alur approval bertingkat (Draft, CFO Review, Director Approve) dilengkapi feedback comments dan reject revisi.
8.  **Laporan & Ekspor (Modul 10)**: Ekspor dokumen RKAP ke format file Excel (.xlsx) dengan SheetJS atau laporan PDF formal dengan jsPDF.

## Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat
- **Node.js** (LTS / v24+)
- **npm** atau **pnpm**

### Instalasi & Memulai Development Server

1.  Buka terminal di root direktori project (`d:\MyProject\CorPlan`).
2.  Jalankan perintah berikut untuk menginstal semua dependency:
    ```bash
    npm install
    ```
3.  Jalankan server pengembangan lokal (Vite):
    ```bash
    npm run dev
    ```
4.  Buka browser Anda dan akses alamat:
    `http://localhost:3000`

## Peran Pengguna untuk Uji Coba (Quick Login)
Gunakan opsi **Masuk Cepat** pada halaman Login untuk mencoba journey masing-masing user persona:
-   **Finance Manager** (`finance@corplan.id`): Membuat siklus RKAP, menginput/merevisi anggaran, memicu kalkulasi, mengirimkan persetujuan.
-   **CFO / Direktur Keuangan** (`cfo@corplan.id`): Meninjau seluruh draf proyeksi, merubah asumsi modal kerja (DSO/DIO/DPO) di Arus Kas, menyetujui (Approve) atau mengembalikan draf untuk direvisi (Reject/Revise).
-   **Kepala Departemen Sales** (`sales@corplan.id`): Membantu pengisian target penjualan produk.
-   **Super Admin** (`admin@corplan.id`): Mengakses konfigurasi master data (Chart of Accounts, Departemen, Log Audit).
