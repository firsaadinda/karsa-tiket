// Mock Data awal berdasarkan Skema-Firestore-Karsa-Tiket
export const initialEvents = [
  {
    id: "Ev27dKm",
    nama: "Workshop Sablon Tote Bag",
    tanggal: "2026-10-18",
    lokasi: "Ruang Karsa, Jl. Merdeka No. 21",
    harga_tiket: 75000,
    kuota: 30,
    tiket_terjual: 2,
    dibuat_pada: "2026-10-01T08:00:00Z"
  },
  {
    id: "Ev88xLp",
    nama: "Konser Mini Akustik Senja",
    tanggal: "2026-10-25",
    lokasi: "Amfiteater Komunitas Kreatif",
    harga_tiket: 50000,
    kuota: 60,
    tiket_terjual: 60, // Contoh status Habis
    dibuat_pada: "2026-10-02T10:15:00Z"
  },
  {
    id: "Ev34mQz",
    nama: "Kelas Keramik & Tembikar Dasar",
    tanggal: "2026-11-05",
    lokasi: "Studio Seni Laras, Pavilion B",
    harga_tiket: 120000,
    kuota: 15,
    tiket_terjual: 8,
    dibuat_pada: "2026-10-03T09:00:00Z"
  }
];

export const initialPembeli = [
  {
    id: "081355512345",
    nama: "Nadia Putri",
    no_whatsapp: "081355512345",
    email: "nadia.putri@contoh.id",
    dibuat_pada: "2026-10-01T08:30:00Z"
  },
  {
    id: "081299887766",
    nama: "Budi Santoso",
    no_whatsapp: "081299887766",
    email: "budi.santoso@email.com",
    dibuat_pada: "2026-10-01T11:20:00Z"
  },
  {
    id: "085611223344",
    nama: "Rian Pratama",
    no_whatsapp: "085611223344",
    email: "rian.pratama@webmail.id",
    dibuat_pada: "2026-10-02T14:45:00Z"
  }
];

export const initialTiket = [
  {
    id: "Tk63fHs",
    event_id: "Ev27dKm",
    nama_event: "Workshop Sablon Tote Bag",
    tanggal_event: "2026-10-18",
    pembeli_id: "081355512345",
    nama_pembeli: "Nadia Putri",
    harga_tiket: 75000,
    jumlah_tiket: 2,
    total: 150000,
    status: "menunggu_bayar",
    dibuat_pada: "2026-10-01T09:15:00Z"
  },
  {
    id: "Tk91aBq",
    event_id: "Ev34mQz",
    nama_event: "Kelas Keramik & Tembikar Dasar",
    tanggal_event: "2026-11-05",
    pembeli_id: "081299887766",
    nama_pembeli: "Budi Santoso",
    harga_tiket: 120000,
    jumlah_tiket: 3,
    total: 360000,
    status: "lunas",
    dibuat_pada: "2026-10-02T16:00:00Z"
  },
  {
    id: "Tk45kLk",
    event_id: "Ev88xLp",
    nama_event: "Konser Mini Akustik Senja",
    tanggal_event: "2026-10-25",
    pembeli_id: "085611223344",
    nama_pembeli: "Rian Pratama",
    harga_tiket: 50000,
    jumlah_tiket: 1,
    total: 50000,
    status: "hadir",
    dibuat_pada: "2026-10-03T11:10:00Z"
  }
];

// Helper formatter Rupiah
export function formatRupiah(number) {
  if (number === 0) return 'Gratis (Rp 0)';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number);
}
