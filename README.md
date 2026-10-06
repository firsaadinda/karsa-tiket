# Karsa Tiket - Tiketing Event & Workshop

Aplikasi manajemen dan penjualan tiket event komunitas kreatif, workshop seni, dan konser musik mini. Dibangun dengan React 19, Vite, dan terintegrasi secara real-time dengan Google Cloud Firestore.

- 🌐 **Live Demo (Netlify):** [https://karsa-tiket.netlify.app](https://karsa-tiket.netlify.app)
- 📦 **Repository (GitHub):** [https://github.com/firsaadinda/karsa-tiket](https://github.com/firsaadinda/karsa-tiket)

## Fitur Utama

1. **Kelola Acara (Event):**
   - Manajemen jadwal, lokasi, harga tiket, dan kuota kursi.
   - Sisa kuota dan persentase keterisian dihitung secara otomatis.
   - Banner hero modern dengan layout 3 section yang estetis.

2. **Master Pembeli:**
   - Pencatatan kontak pembeli unik berdasarkan nomor WhatsApp (`08xx`).
   - Pencarian instan berdasarkan nama atau nomor kontak.
   - Pencegahan nomor WhatsApp ganda via Firestore query.

3. **Transaksi & Pemesanan Tiket:**
   - Pemilihan event dengan kuota aktif dan otomatisasi kalkulasi total pembayaran.
   - Alur status berjenjang: `Menunggu Bayar` ➔ `Sudah Dibayar (Lunas)` ➔ `Check-in (Hadir)` atau `Dibatalkan`.
   - Unggah bukti transfer (PNG/JPG) dan preview struk pembayaran digital.
   - Modal Rincian Pesanan dengan 4-step progress tracker.
   - Otomatisasi kuota: penambahan `tiket_terjual` saat pembelian dan pengembalian kuota saat pembatalan.

4. **Rekap Penjualan & Kehadiran:**
   - Dashboard analitik KPI pendapatan terverifikasi (hanya tiket lunas/hadir).
   - Monitoring rasio kehadiran peserta acara dan persentase penjualan.

## Teknologi

- **Frontend:** React 19, Vite, Lucide React Icons, Plus Jakarta Sans typography.
- **Backend / Database:** Firebase Cloud Firestore (Jakarta Region `asia-southeast2`).
- **Security:** Firebase Security Rules (`firestore.rules`) yang menjaga validasi tipe, integritas status, dan invariant data.
- **Hosting:** Netlify dengan dukungan SPA redirect.
