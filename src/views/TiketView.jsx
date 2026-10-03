import React, { useState } from 'react';
import { Plus, Ticket as TicketIcon, Calendar, CheckCircle, XCircle, UserCheck, AlertCircle, Trash2, Search } from 'lucide-react';
import { formatRupiah } from '../data/mockData';
import { Modal, ConfirmDialog } from '../components/Modal';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/StateViews';

export default function TiketView({
  tiketList,
  setTiketList,
  events,
  setEvents,
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

  const handleSubmit = (e) => {
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

    // Buat snapshot dokumen tiket
    const newTiket = {
      id: 'Tk' + Math.random().toString(36).substring(2, 8),
      event_id: activeSelectedEvent.id,
      nama_event: activeSelectedEvent.nama,
      tanggal_event: activeSelectedEvent.tanggal,
      pembeli_id: selectedPembeli.id,
      nama_pembeli: selectedPembeli.nama,
      harga_tiket: activeSelectedEvent.harga_tiket,
      jumlah_tiket: qty,
      total: activeSelectedEvent.harga_tiket * qty,
      status: 'menunggu_bayar',
      dibuat_pada: new Date().toISOString(),
    };

    // Update state tiket
    setTiketList([newTiket, ...tiketList]);

    // Update stok event: tambah tiket_terjual
    setEvents(events.map((ev) => (ev.id === activeSelectedEvent.id ? {
      ...ev,
      tiket_terjual: ev.tiket_terjual + qty,
    } : ev)));

    showToast('Tiket berhasil dicatat (Menunggu Bayar)', 'success');
    setIsModalOpen(false);
  };

  // Alur Status: menunggu_bayar -> lunas
  const handleMarkLunas = (tiket) => {
    setTiketList(tiketList.map((t) => (t.id === tiket.id ? { ...t, status: 'lunas' } : t)));
    showToast(`Tiket ${tiket.nama_pembeli} berhasil dilunasi`, 'success');
  };

  // Alur Status: lunas -> hadir (check-in)
  const handleCheckIn = (tiket) => {
    setTiketList(tiketList.map((t) => (t.id === tiket.id ? { ...t, status: 'hadir' } : t)));
    showToast(`Check-in berhasil untuk ${tiket.nama_pembeli}`, 'success');
  };

  // Alur Status: menunggu_bayar -> dibatalkan (kembalikan kuota)
  const handleConfirmCancel = () => {
    if (!cancelTarget) return;

    setTiketList(tiketList.map((t) => (t.id === cancelTarget.id ? { ...t, status: 'dibatalkan' } : t)));

    // Kembalikan kuota ke event terkait
    setEvents(events.map((ev) => (ev.id === cancelTarget.event_id ? {
      ...ev,
      tiket_terjual: Math.max(0, ev.tiket_terjual - cancelTarget.jumlah_tiket),
    } : ev)));

    showToast(`Tiket dibatalkan. Kuota ${cancelTarget.jumlah_tiket} tiket dikembalikan.`, 'success');
    setCancelTarget(null);
  };

  // Hapus transaksi tiket permanen
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    // Jika tiket berstatus selain dibatalkan, kembalikan kuota juga bila dihapus
    if (deleteTarget.status !== 'dibatalkan') {
      setEvents(events.map((ev) => (ev.id === deleteTarget.event_id ? {
        ...ev,
        tiket_terjual: Math.max(0, ev.tiket_terjual - deleteTarget.jumlah_tiket),
      } : ev)));
    }

    setTiketList(tiketList.filter((t) => t.id !== deleteTarget.id));
    showToast('Data transaksi tiket berhasil dihapus', 'success');
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
        return <span className="badge badge-warning">Menunggu Bayar</span>;
      case 'lunas':
        return <span className="badge badge-info">Lunas</span>;
      case 'hadir':
        return <span className="badge badge-success">Hadir (Checked-in)</span>;
      case 'dibatalkan':
        return <span className="badge badge-danger">Dibatalkan</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
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
          {filteredTiket.map((tiket) => (
            <div key={tiket.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{tiket.nama_event}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.83rem', marginTop: '4px' }}>
                    <Calendar size={14} />
                    <span>{tiket.tanggal_event}</span>
                  </div>
                </div>
                {getStatusBadge(tiket.status)}
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '8px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Pembeli</span>
                  <strong>{tiket.nama_pembeli}</strong>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>({tiket.pembeli_id})</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Jumlah</span>
                  <strong>{tiket.jumlah_tiket} Tiket</strong>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>@ {formatRupiah(tiket.harga_tiket)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Total Bayar</span>
                  <strong style={{ color: 'var(--primary-700)', fontSize: '1rem' }}>{formatRupiah(tiket.total)}</strong>
                </div>
              </div>

              {/* Action Buttons Sesuai State Machine PRD */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {tiket.status === 'menunggu_bayar' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => handleMarkLunas(tiket)}
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
          ))}
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
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan Tiket
            </button>
          </div>
        </form>
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
