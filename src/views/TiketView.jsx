import React, { useState } from 'react';
import { Plus, Calendar, CheckCircle, XCircle, UserCheck, Trash2, Search, Upload, MapPin, Check } from 'lucide-react';
import { formatRupiah } from '../data/mockData';
import { Modal, ConfirmDialog } from '../components/Modal';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import {
  addTiketData,
  updateTiketStatusData,
  cancelTiketData,
  deleteTiketData
} from '../services/firestoreService';

export default function TiketView({
  tiketList,
  events,
  pembeliList,
  showToast,
  isLoading,
  isError,
  onRetry
}) {
  const [activeTab, setActiveTab] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Modal Rincian Tiket (Lampiran 2)
  const [detailTarget, setDetailTarget] = useState(null);

  // State untuk Konfirmasi Pelunasan & Bukti Transfer
  const [lunasTarget, setLunasTarget] = useState(null);
  const [metodePembayaran, setMetodePembayaran] = useState('Transfer Bank BCA');
  const [catatanBayar, setCatatanBayar] = useState('');
  const [buktiPreviewUrl, setBuktiPreviewUrl] = useState('');
  const [buktiFileName, setBuktiFileName] = useState('');

  // State untuk Modal Preview Bukti Transfer
  const [previewTarget, setPreviewTarget] = useState(null);

  // Form State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedPembeliId, setSelectedPembeliId] = useState('');
  const [jumlahTiket, setJumlahTiket] = useState(1);
  const [formError, setFormError] = useState('');

  // Hitung event yang masih memiliki sisa kuota
  const availableEvents = events.filter((e) => e.kuota - e.tiket_terjual > 0);
  const activeSelectedEvent = events.find((e) => e.id === selectedEventId);
  const sisaKuota = activeSelectedEvent ? activeSelectedEvent.kuota - activeSelectedEvent.tiket_terjual : 0;
  const calculatedTotal = activeSelectedEvent ? activeSelectedEvent.harga_tiket * jumlahTiket : 0;

  const handleOpenAdd = () => {
    if (events.length === 0) {
      showToast('Tambahkan event terlebih dahulu sebelum membuat tiket.', 'error');
      return;
    }
    if (pembeliList.length === 0) {
      showToast('Tambahkan data pembeli terlebih dahulu.', 'error');
      return;
    }
    if (availableEvents.length === 0) {
      showToast('Seluruh kuota event telah habis.', 'error');
      return;
    }

    setSelectedEventId(availableEvents[0].id);
    setSelectedPembeliId(pembeliList[0].id);
    setJumlahTiket(1);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!activeSelectedEvent) {
      setFormError('Pilih event yang valid.');
      return;
    }

    const selectedPembeli = pembeliList.find((p) => p.id === selectedPembeliId);
    if (!selectedPembeli) {
      setFormError('Pilih pembeli yang valid.');
      return;
    }

    const qty = parseInt(jumlahTiket, 10);
    // Invariant 2: jumlah_tiket 1 sampai 5 dan tidak melebihi sisa kuota
    if (isNaN(qty) || qty < 1 || qty > 5) {
      setFormError('Jumlah tiket harus antara 1 sampai 5.');
      return;
    }
    if (qty > sisaKuota) {
      setFormError(`Jumlah tiket melebihi sisa kuota event (${sisaKuota}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      // Simpan dokumen tiket ke Firestore (dengan increment otomatis tiket_terjual event)
      await addTiketData({
        event_id: activeSelectedEvent.id,
        nama_event: activeSelectedEvent.nama,
        tanggal_event: activeSelectedEvent.tanggal,
        pembeli_id: selectedPembeli.id,
        nama_pembeli: selectedPembeli.nama,
        harga_tiket: activeSelectedEvent.harga_tiket,
        jumlah_tiket: qty,
        total: activeSelectedEvent.harga_tiket * qty,
      });

      showToast('Tiket berhasil dicatat (Menunggu Bayar) di Firestore', 'success');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving tiket:', err);
      showToast('Gagal mencatat tiket: ' + (err.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCleanBankPrefix = (method) => {
    return method.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  // Alur Status: Buka Modal Konfirmasi Pelunasan & Bukti Transfer
  const handleOpenLunas = (tiket) => {
    setLunasTarget(tiket);
    const defaultMethod = 'Transfer Bank BCA';
    setMetodePembayaran(defaultMethod);
    setCatatanBayar('');
    setBuktiPreviewUrl('');
    // Format standar: metode_pembayaran_bank_png/jpg
    const prefix = getCleanBankPrefix(defaultMethod);
    setBuktiFileName(`${prefix}_${tiket.pembeli_id}.jpg`);
  };

  const handleMetodeChange = (method) => {
    setMetodePembayaran(method);
    const prefix = getCleanBankPrefix(method);
    const ext = buktiFileName.split('.').pop() || 'jpg';
    setBuktiFileName(`${prefix}_${lunasTarget ? lunasTarget.pembeli_id : 'pembeli'}.${ext}`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBuktiPreviewUrl(event.target?.result);
    };
    reader.readAsDataURL(file);

    const ext = file.name.split('.').pop() || 'jpg';
    const prefix = getCleanBankPrefix(metodePembayaran);
    setBuktiFileName(`${prefix}_${lunasTarget ? lunasTarget.pembeli_id : 'pembeli'}.${ext}`);
  };

  const handleConfirmLunas = async (e) => {
    e.preventDefault();
    if (!lunasTarget) return;

    try {
      setIsSubmitting(true);
      await updateTiketStatusData(lunasTarget.id, 'lunas', {
        metode_pembayaran: metodePembayaran,
        catatan_bayar: catatanBayar.trim() || `Lunas via ${metodePembayaran}`,
        bukti_transfer_nama: buktiFileName || `${getCleanBankPrefix(metodePembayaran)}_${lunasTarget.pembeli_id}.jpg`,
      });

      showToast(`Tiket ${lunasTarget.nama_pembeli} berhasil dilunasi di Firestore`, 'success');
      setLunasTarget(null);
    } catch (err) {
      console.error('Error updating tiket status:', err);
      showToast('Gagal melunasi tiket: ' + (err.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alur Status: lunas -> hadir (check-in)
  const handleCheckIn = async (tiket) => {
    try {
      await updateTiketStatusData(tiket.id, 'hadir');
      showToast(`Check-in berhasil untuk ${tiket.nama_pembeli}`, 'success');
    } catch (err) {
      console.error('Error check-in tiket:', err);
      showToast('Gagal check-in tiket: ' + (err.message || 'Terjadi kesalahan'), 'error');
    }
  };

  // Alur Status: menunggu_bayar -> dibatalkan (kembalikan kuota)
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    try {
      await cancelTiketData(cancelTarget.id, cancelTarget.event_id, cancelTarget.jumlah_tiket);
      showToast(`Tiket dibatalkan. Kuota ${cancelTarget.jumlah_tiket} tiket dikembalikan ke event.`, 'success');
    } catch (err) {
      console.error('Error cancelling tiket:', err);
      showToast('Gagal membatalkan tiket: ' + (err.message || 'Terjadi kesalahan'), 'error');
    }
    setCancelTarget(null);
  };

  // Hapus transaksi tiket permanen dari Firestore
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const shouldRestore = deleteTarget.status !== 'dibatalkan';
      await deleteTiketData(deleteTarget.id, deleteTarget.event_id, deleteTarget.jumlah_tiket, shouldRestore);
      showToast('Data transaksi tiket berhasil dihapus dari Firestore', 'success');
    } catch (err) {
      console.error('Error deleting tiket:', err);
      showToast('Gagal menghapus tiket: ' + (err.message || 'Terjadi kesalahan'), 'error');
    }
    setDeleteTarget(null);
  };

  // Filter Tiket berdasarkan Tab dan Kata Kunci Pencarian (Nama / No WA)
  const filteredTiket = tiketList.filter((t) => {
    const matchesTab = activeTab === 'semua' || t.status === activeTab;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      t.nama_pembeli.toLowerCase().includes(term) ||
      t.pembeli_id.includes(term) ||
      t.nama_event.toLowerCase().includes(term);
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'menunggu_bayar':
        return (
          <span style={{
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            Menunggu Bayar
          </span>
        );
      case 'lunas':
        return (
          <span style={{
            background: '#dbeafe',
            color: '#1e40af',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            Sudah Dibayar
          </span>
        );
      case 'hadir':
        return (
          <span style={{
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            Selesai
          </span>
        );
      case 'dibatalkan':
        return (
          <span style={{
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            Dibatalkan
          </span>
        );
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const renderAlurStatus = (status) => {
    const steps = [
      { key: 'menunggu_bayar', label: 'Menunggu Bayar' },
      { key: 'lunas', label: 'Sudah Dibayar' },
      { key: 'hadir', label: 'Selesai' },
    ];

    if (status === 'dibatalkan') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontSize: '0.78rem',
            fontWeight: '700'
          }}>
            Dibatalkan
          </span>
        </div>
      );
    }

    const currentIndex = steps.findIndex((s) => s.key === status);

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap',
        fontSize: '0.78rem',
        fontWeight: '600'
      }}>
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPast = idx < currentIndex;

          let pillStyle = {};
          if (isActive) {
            pillStyle = {
              background: '#2f432a', // Solid dark olive pill seperti di Lampiran 1
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontWeight: '700',
              boxShadow: 'var(--shadow-sm)'
            };
          } else if (isPast) {
            pillStyle = {
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)'
            };
          } else {
            pillStyle = {
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)'
            };
          }

          return (
            <React.Fragment key={step.key}>
              <span style={pillStyle}>{step.label}</span>
              {idx < steps.length - 1 && (
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>&gt;</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Transaksi Tiket</h2>
          <p className="page-subtitle">Pencatatan pembelian, pelunasan transfer, dan absensi kehadiran.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Buat Tiket</span>
        </button>
      </div>

      {/* Kolom Cari Tiket / Pembeli untuk Kemudahan Check-in */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Cari tiket berdasarkan nama pembeli, no. WhatsApp, atau nama event..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
        <Search
          size={18}
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
      </div>

      {/* Tabs Filter Status */}
      <div className="tabs-container">
        {[
          { id: 'semua', label: 'Semua' },
          { id: 'menunggu_bayar', label: 'Menunggu Bayar' },
          { id: 'lunas', label: 'Lunas' },
          { id: 'hadir', label: 'Hadir' },
          { id: 'dibatalkan', label: 'Dibatalkan' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3-State Handling */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : tiketList.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi tiket"
          description="Mulai catat pemesanan tiket pertama dari pembeli."
          actionText="Buat Tiket Baru"
          onAction={handleOpenAdd}
        />
      ) : filteredTiket.length === 0 ? (
        <div className="state-box">
          <h4 className="state-title">Tidak Ada Tiket</h4>
          <p className="state-desc">Tidak ada tiket dengan status "{activeTab}".</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('semua')}>
            Lihat Semua Tiket
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredTiket.map((tiket) => {
            const currentEvent = events.find((e) => e.id === tiket.event_id);
            return (
              <div key={tiket.id} className="card" style={{ padding: '18px 20px' }}>
                {/* Header: #id  Lihat Rincian  ...  Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '600' }}>#{tiket.id}</span>
                    <button
                      type="button"
                      onClick={() => setDetailTarget(tiket)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-main)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: '600',
                        padding: 0
                      }}
                    >
                      Lihat Rincian
                    </button>
                  </div>
                  {getStatusBadge(tiket.status)}
                </div>

                {/* Nama Pelanggan / Pembeli */}
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {tiket.nama_pembeli}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
                  <Calendar size={14} />
                  <span>{tiket.tanggal_event} • {tiket.pembeli_id}</span>
                </div>

                {/* Kotak 1: Lokasi & Bukti/Catatan */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <MapPin size={15} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                    <span>{currentEvent?.lokasi || 'Lokasi Acara'}</span>
                  </div>
                  <div style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    paddingTop: '6px',
                    borderTop: '1px dashed var(--border-default)'
                  }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Bukti/Catatan:</strong>{' '}
                    <span>{tiket.catatan_bayar || tiket.bukti_transfer_nama || '-'}</span>
                  </div>
                </div>

                {/* Kotak 2: Event, Qty & Total Tagihan */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>{tiket.nama_event}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {tiket.jumlah_tiket} × {formatRupiah(tiket.harga_tiket)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px dashed var(--border-default)',
                    paddingTop: '8px',
                    marginTop: '8px'
                  }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Total Tagihan</strong>
                    <strong style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '800' }}>
                      {formatRupiah(tiket.total)}
                    </strong>
                  </div>
                </div>

                {/* ALUR STATUS */}
                <div style={{ marginBottom: '14px' }}>
                  <span style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.05em',
                    marginBottom: '8px'
                  }}>
                    ALUR STATUS
                  </span>
                  {renderAlurStatus(tiket.status)}
                </div>

                {/* Action Buttons Sesuai State Machine PRD */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tiket.status === 'menunggu_bayar' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleOpenLunas(tiket)}
                        >
                          <CheckCircle size={14} />
                          <span>Konfirmasi Lunas</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => setCancelTarget(tiket)}
                        >
                          <XCircle size={14} />
                          <span>Batalkan</span>
                        </button>
                      </>
                    )}

                    {tiket.status === 'lunas' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleCheckIn(tiket)}
                      >
                        <UserCheck size={14} />
                        <span>Check-in (Hadir)</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger-solid)' }}
                    onClick={() => setDeleteTarget(tiket)}
                    title="Hapus Dokumen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Tiket */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Pembelian Tiket"
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              border: '1px solid var(--danger-border)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '14px'
            }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Pilih Event <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setJumlahTiket(1);
              }}
              required
            >
              {availableEvents.map((ev) => {
                const sisa = ev.kuota - ev.tiket_terjual;
                return (
                  <option key={ev.id} value={ev.id}>
                    {ev.nama} ({ev.tanggal}) - Sisa {sisa} Kuota - {formatRupiah(ev.harga_tiket)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Pilih Pembeli <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={selectedPembeliId}
              onChange={(e) => setSelectedPembeliId(e.target.value)}
              required
            >
              {pembeliList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.no_whatsapp})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Jumlah Tiket <span className="required">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={Math.min(5, sisaKuota)}
              className="form-control"
              value={jumlahTiket}
              onChange={(e) => setJumlahTiket(e.target.value)}
              required
            />
            <span className="form-hint">Maksimal 5 tiket per transaksi (Sisa kuota: {sisaKuota})</span>
          </div>

          {/* Kalkulasi Total Otomatis */}
          <div style={{
            background: 'var(--primary-50)',
            border: '1px solid var(--primary-100)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            margin: '16px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary-700)', fontWeight: '600', display: 'block' }}>
                Kalkulasi Total Pembayaran:
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {activeSelectedEvent ? `${formatRupiah(activeSelectedEvent.harga_tiket)} × ${jumlahTiket} tiket` : '-'}
              </span>
            </div>
            <strong style={{ fontSize: '1.25rem', color: 'var(--primary-700)' }}>
              {formatRupiah(calculatedTotal)}
            </strong>
          </div>

          <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tiket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Lunas & Unggah Bukti Transfer */}
      <Modal
        isOpen={Boolean(lunasTarget)}
        onClose={() => setLunasTarget(null)}
        title="Konfirmasi Pembayaran Lunas"
      >
        {lunasTarget && (
          <form onSubmit={handleConfirmLunas}>
            {/* Ringkasan Pembayaran */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pembeli:</span>
                <strong>{lunasTarget.nama_pembeli} ({lunasTarget.pembeli_id})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Event:</span>
                <span>{lunasTarget.nama_event}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-default)', paddingTop: '6px', marginTop: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Total Tagihan:</span>
                <strong style={{ color: 'var(--primary-700)', fontSize: '1rem' }}>{formatRupiah(lunasTarget.total)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Metode Pembayaran / Bank <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={metodePembayaran}
                onChange={(e) => handleMetodeChange(e.target.value)}
                required
              >
                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                <option value="QRIS">QRIS (GoPay / OVO / Dana / ShopeePay)</option>
                <option value="Tunai">Tunai (Cash di Tempat)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Nama Bukti Transfer (Otomatis Format: <code>metode_bank_png/jpg</code>)
              </label>
              <input
                type="text"
                className="form-control"
                value={buktiFileName}
                onChange={(e) => setBuktiFileName(e.target.value)}
                placeholder="Contoh: transfer_bank_bca_081355512345.jpg"
              />
              <span className="form-hint">Sesuai format: <code>metode pembayaran_bank_png/jpg</code></span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Unggah Foto Bukti Transfer (PNG / JPG)
              </label>
              <div style={{
                border: '1.5px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
                background: '#ffffff',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <Upload size={22} style={{ color: 'var(--primary-600)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    {buktiPreviewUrl ? 'Ganti file foto bukti transfer' : 'Pilih file foto bukti transfer'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Mendukung format JPG, JPEG, PNG
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Gambar jika diunggah */}
            {buktiPreviewUrl && (
              <div style={{
                marginBottom: '16px',
                padding: '10px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                border: '1px solid var(--border-default)'
              }}>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Preview Bukti Transfer:
                </span>
                <img
                  src={buktiPreviewUrl}
                  alt="Bukti Transfer"
                  style={{
                    maxHeight: '180px',
                    maxWidth: '100%',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'contain',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Catatan / Keterangan Transfer (Opsional)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: Transfer m-BCA a.n. Nadia Putri"
                value={catatanBayar}
                onChange={(e) => setCatatanBayar(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setLunasTarget(null)} disabled={isSubmitting}>
                Batal
              </button>
              <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                <CheckCircle size={16} />
                <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi Lunas & Simpan Bukti'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Preview Bukti Transfer & Catatan Pembayaran */}
      <Modal
        isOpen={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        title="Detail Bukti Pembayaran"
      >
        {previewTarget && (
          <div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>ID Tiket:</span>
                <code>{previewTarget.id}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pembeli:</span>
                <strong>{previewTarget.nama_pembeli}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nomor WhatsApp:</span>
                <span>{previewTarget.pembeli_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Metode Bayar:</span>
                <strong>{previewTarget.metode_pembayaran || 'Transfer Bank'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nama File Bukti:</span>
                <code style={{ color: 'var(--primary-700)' }}>{previewTarget.bukti_transfer_nama || 'bukti_transfer.jpg'}</code>
              </div>
              {previewTarget.catatan_bayar && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Catatan:</span>
                  <span>{previewTarget.catatan_bayar}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-default)', paddingTop: '8px', marginTop: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Total Dilunasi:</span>
                <strong style={{ color: 'var(--success-solid)', fontSize: '1.05rem' }}>{formatRupiah(previewTarget.total)}</strong>
              </div>
            </div>

            {/* Preview Struk Gambar / Digital Receipt */}
            {previewTarget.bukti_transfer_url ? (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <img
                  src={previewTarget.bukti_transfer_url}
                  alt="Bukti Transfer"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '320px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-sm)',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ) : (
              <div style={{
                background: '#ffffff',
                border: '1.5px dashed var(--success-border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 16px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--success-bg)',
                  color: 'var(--success-text)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  marginBottom: '10px'
                }}>
                  <CheckCircle size={14} />
                  <span>TRANSAKSI LUNAS</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Lampiran: <strong>{previewTarget.bukti_transfer_nama}</strong>
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Metode: {previewTarget.metode_pembayaran || 'Transfer Bank'} • Divalidasi oleh Panitia Karsa Tiket
                </p>
              </div>
            )}

            <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPreviewTarget(null)}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Rincian Tiket / Pesanan (Sesuai Lampiran 2) */}
      <Modal
        isOpen={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        title={
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              #{detailTarget?.id}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
              Rincian Pesanan
            </div>
          </div>
        }
      >
        {detailTarget && (() => {
          const detailEvent = events.find((e) => e.id === detailTarget.event_id);
          // 4-Step Pipeline sesuai Lampiran 2: Menunggu -> Dibayar -> Diproses -> Selesai
          const steps = [
            { key: 'menunggu', num: 1, label: 'Menunggu' },
            { key: 'dibayar', num: 2, label: 'Dibayar' },
            { key: 'diproses', num: 3, label: 'Diproses' },
            { key: 'selesai', num: 4, label: 'Selesai' },
          ];

          // Map status tiket ke level index (0: menunggu_bayar, 1: lunas, 3: hadir)
          let currentStepIdx = 0;
          if (detailTarget.status === 'lunas') currentStepIdx = 1;
          if (detailTarget.status === 'hadir') currentStepIdx = 3;

          return (
            <div>
              {/* Stepper Progress Bar (Persis Lampiran 2) */}
              <div style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '12px 12px 28px 12px'
              }}>
                {/* Garis Horizontal Penghubung */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '24px',
                  right: '24px',
                  height: '2px',
                  background: '#cbd5e1',
                  zIndex: 0
                }} />

                {steps.map((st, idx) => {
                  const isDone = idx <= currentStepIdx && detailTarget.status !== 'dibatalkan';
                  const isCurrent = idx === currentStepIdx && detailTarget.status !== 'dibatalkan';

                  let squareBg = '#cbd5e1';
                  let squareColor = '#ffffff';

                  if (isDone) {
                    // Hijau untuk yang selesai, atau Biru untuk status aktif selesai/diproses seperti Lampiran 2
                    squareBg = idx === 3 ? '#1d4ed8' : '#15803d';
                  }

                  return (
                    <div
                      key={st.key}
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: squareBg,
                        color: squareColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        {isDone && idx < 3 ? (
                          <Check size={18} strokeWidth={3} />
                        ) : (
                          st.num
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: isCurrent ? '700' : '500',
                        color: isCurrent && idx === 3 ? '#1d4ed8' : isDone ? 'var(--text-main)' : 'var(--text-muted)'
                      }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Kotak 1: Rincian Paket Event & Total Tagihan (Lampiran 2) */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                marginBottom: '14px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {detailTarget.nama_event}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {formatRupiah(detailTarget.harga_tiket)} × {detailTarget.jumlah_tiket} tiket = {formatRupiah(detailTarget.total)}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px dashed #e2e8f0',
                  paddingTop: '12px',
                  marginTop: '6px'
                }}>
                  <strong style={{ fontSize: '1.05rem', color: '#1d4ed8', fontWeight: '800' }}>
                    Total Tagihan:
                  </strong>
                  <strong style={{ fontSize: '1.25rem', color: '#1d4ed8', fontWeight: '800' }}>
                    {formatRupiah(detailTarget.total)}
                  </strong>
                </div>
              </div>

              {/* Kotak 2: Pelanggan, Alamat/Lokasi, Tanggal, Bukti/Catatan (Lampiran 2) */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.88rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div>
                  <strong>Pelanggan:</strong>{' '}
                  <span>{detailTarget.nama_pembeli} ({detailTarget.pembeli_id})</span>
                </div>
                <div>
                  <strong>Alamat / Lokasi:</strong>{' '}
                  <span>{detailEvent?.lokasi || 'Lokasi Acara'}</span>
                </div>
                <div>
                  <strong>Tanggal Pesanan:</strong>{' '}
                  <span>{detailTarget.tanggal_event}</span>
                </div>
                <div>
                  <strong>Bukti/Catatan:</strong>{' '}
                  <span>{detailTarget.catatan_bayar || detailTarget.bukti_transfer_nama || '-'}</span>
                </div>

                {detailTarget.bukti_transfer_url && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
                      Lampiran Foto Bukti Transfer:
                    </span>
                    <img
                      src={detailTarget.bukti_transfer_url}
                      alt="Bukti Transfer"
                      style={{
                        maxHeight: '180px',
                        maxWidth: '100%',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetailTarget(null)}
                >
                  Tutup
                </button>
                {detailTarget.status === 'menunggu_bayar' && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      const tgt = detailTarget;
                      setDetailTarget(null);
                      handleOpenLunas(tgt);
                    }}
                  >
                    <CheckCircle size={16} />
                    <span>Konfirmasi Lunas</span>
                  </button>
                )}
                {detailTarget.status === 'lunas' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      handleCheckIn(detailTarget);
                      setDetailTarget(null);
                    }}
                  >
                    <UserCheck size={16} />
                    <span>Check-in (Hadir)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Dialog Konfirmasi Pembatalan Tiket */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Batalkan Tiket Ini?"
        message={`Apakah Anda yakin ingin membatalkan tiket untuk "${cancelTarget?.nama_pembeli}"? Kuota ${cancelTarget?.jumlah_tiket} tiket akan otomatis dikembalikan ke event.`}
        confirmText="Batalkan Tiket"
        isDanger={true}
      />

      {/* Dialog Konfirmasi Hapus Dokumen */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan Tiket?"
        message={`Apakah Anda yakin ingin menghapus data dokumen tiket ID "${deleteTarget?.id}"?`}
        confirmText="Hapus Permanen"
        isDanger={true}
      />
    </div>
  );
}
