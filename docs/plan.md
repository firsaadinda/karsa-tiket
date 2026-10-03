# Rencana Implementasi Bertahap (Implementation Plan) - Karsa Tiket

Rencana ini disusun secara modular dan bertahap mengikuti metodologi *superpowers*: mulai dari persiapan dasar, penyusunan UI dengan *mock data* (Bagian A), integrasi Firestore (Bagian B), pembuatan *security rules*, hingga *deployment* ke Netlify.

---

## Tahap 1: Setup Proyek & Fondasi Desain
- [ ] **1.1 Inisialisasi Vite + React**
  - Setup React SPA menggunakan Vite di workspace.
  - Konfigurasi styling (CSS/Tailwind) dengan tema warna modern (indigo/violet & amber untuk aksen tiket).
  - Pasang dependensi esensial: `lucide-react` (ikon), `firebase` (SDK modular).
- [ ] **1.2 Layout & Komponen Global**
  - Komponen `Navbar` responsif dengan 4 navigasi modul: **Event**, **Pembeli**, **Tiket**, **Rekap**.
  - Komponen `Modal` / `Dialog` konfirmasi hapus yang seragam.
  - Komponen `Toast` untuk umpan balik aksi (sukses / galat).
  - Komponen dasar 3-state: `LoadingSkeleton`, `EmptyState`, `ErrorState` (dengan tombol *Coba Lagi*).

---

## Tahap 2: Mock Data & Prototipe UI (Bagian A Tugas Mandiri)

### 2.1 Modul Event (Master Acara)
- [ ] **Daftar Event**:
  - Tampilan kartu acara: tanggal, lokasi, harga tiket format rupiah, sisa kuota (`kuota - tiket_terjual`), badge status "Habis".
  - Pasang 3-state (Loading, Empty, Error).
- [ ] **Formulir Event (Tambah & Ubah)**:
  - Form modal/halaman dengan input: Nama, Tanggal (`date`), Lokasi, Harga Tiket, Kuota.
  - Validasi: Harga $\ge 0$, Kuota 1 - 500, Kuota baru $\ge tiket\_terjual$.
- [ ] **Aksi Hapus**:
  - Tombol hapus dengan dialog konfirmasi sebelum eksekusi.

### 2.2 Modul Pembeli (Master Kontak)
- [ ] **Daftar & Pencarian Pembeli**:
  - Tampilan tabel/daftar pembeli (Nama, No WhatsApp, Email).
  - Kolom pencarian realtime yang menyaring berdasarkan nama atau no WhatsApp.
  - Pasang 3-state (Loading, Empty, Error).
- [ ] **Formulir Pembeli (Tambah & Ubah)**:
  - Form input: Nama, No WhatsApp (diawali `08`, 10-13 digit), Email (mengandung `@`).
  - Validasi duplikasi nomor WhatsApp (cek apakah sudah terdaftar).
- [ ] **Aksi Hapus**:
  - Tombol hapus dengan dialog konfirmasi.

### 2.3 Modul Tiket (Transaksi)
- [ ] **Daftar Tiket & Tabs Filter**:
  - Tabs filter status: **Semua**, **Menunggu Bayar**, **Lunas**, **Hadir**, **Dibatalkan**.
  - Kartu tiket menampilkan snapshot data: nama event, tanggal event, nama pembeli, jumlah tiket, total bayar, status badge.
  - Pasang 3-state (Loading, Empty, Error).
- [ ] **Formulir Pembelian Tiket**:
  - Dropdown Event (hanya menampilkan event yang memiliki sisa kuota $> 0$).
  - Dropdown Pembeli.
  - Input jumlah tiket: 1 s.d. 5, tidak melebihi sisa kuota.
  - Total bayar terkalkulasi otomatis secara realtime.
  - Saat simpan: Status awal otomatis `menunggu_bayar` dan menambah `tiket_terjual` pada event.
- [ ] **Alur Transisi Status**:
  - Tombol aksi transisi sesuai aturan:
    - `menunggu_bayar` $\rightarrow$ `lunas` (pembayaran diverifikasi)
    - `menunggu_bayar` $\rightarrow$ `dibatalkan` (stok kuota event otomatis dikembalikan)
    - `lunas` $\rightarrow$ `hadir` (check-in saat hari H acara)

### 2.4 Modul Rekap (Dashboard Ringkasan)
- [ ] **Tampilan Rekap per Event**:
  - Dropdown pemilih Event.
  - 4 Kartu KPI:
    1. Tiket Terjual
    2. Sisa Kuota
    3. Total Pendapatan (hanya menghitung tiket `lunas` + `hadir`)
    4. Total Hadir (jumlah peserta check-in)
  - Progress bar kapasitas kuota event.
  - Pasang 3-state (Loading/Skeleton, Empty, Error).

---

## Tahap 3: Integrasi Cloud Firestore (Bagian B Tugas Mandiri)
- [ ] **3.1 Konfigurasi Firebase Client**
  - Buat berkas `src/firebase.js` dengan inisialisasi Firebase modular (`getFirestore`).
  - Konfigurasi environment variables (`.env`).
- [ ] **3.2 Migrasi Data Service per Koleksi**
  - **Koleksi `event`**: Ganti mock data dengan `getDocs(limit(20))`, `addDoc`, `updateDoc`, `deleteDoc`.
  - **Koleksi `pembeli`**: Ganti mock data dengan `getDoc`, `setDoc(doc(db, "pembeli", noWhatsapp))`, `getDocs`, `updateDoc`, `deleteDoc`.
  - **Koleksi `tiket`**:
    - Simpan tiket dengan snapshot data lengkap (`nama_event`, `harga_tiket`, dll.).
    - Update atomik `tiket_terjual` pada event menggunakan `increment(jumlah_tiket)`.
    - Handle pembatalan tiket dengan `increment(-jumlah_tiket)`.
  - **Modul `rekap`**: Query langsung ke Firestore untuk menghitung agregasi data.

---

## Tahap 4: Firestore Security Rules & Pengujian
- [ ] **4.1 Pembuatan `firestore.rules`**
  - Terapkan seluruh aturan validasi untuk koleksi `event`, `pembeli`, dan `tiket`.
  - Cegah perpindahan status ilegal dan perubahan snapshot harga.
- [ ] **4.2 Uji Tembus Mandiri (6 Kasus Uji Tidak Sah)**
  - Uji 1: Field kosong pada form wajib.
  - Uji 2: Tipe salah (contoh: harga bertipe string).
  - Uji 3: Teks melebihi batas karakter.
  - Uji 4: Nilai negatif (contoh: harga < 0).
  - Uji 5: Nilai di luar batas (contoh: jumlah tiket 0 atau > 5, kuota > 500).
  - Uji 6: Transisi status ilegal (contoh: `menunggu_bayar` langsung melompat ke `hadir`).

---

## Tahap 5: Build & Publikasi (Deploy) ke Netlify
- [ ] Validasi build produksi (`npm run build`).
- [ ] Konfigurasi redirect Netlify (`_redirects` untuk SPA routing).
- [ ] Verifikasi seluruh fitur dan uji coba melalui URL Netlify publik dari browser desktop & mobile.
