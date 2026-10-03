import React, { useState } from 'react';
import { Plus, Calendar, MapPin, Tag, Users, Edit2, Trash2, ExternalLink, Compass } from 'lucide-react';
import { formatRupiah } from '../data/mockData';
import { Modal, ConfirmDialog } from '../components/Modal';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/StateViews';

export default function EventView({ events, setEvents, showToast, isLoading, isError, onRetry }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    tanggal: '',
    lokasi: '',
    harga_tiket: 0,
    kuota: 30,
  });
  const [formError, setFormError] = useState('');

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      nama: '',
      tanggal: new Date().toISOString().split('T')[0],
      lokasi: '',
      harga_tiket: 50000,
      kuota: 50,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      nama: event.nama,
      tanggal: event.tanggal,
      lokasi: event.lokasi,
      harga_tiket: event.harga_tiket,
      kuota: event.kuota,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validasi Acceptance Criteria PRD
    if (!formData.nama.trim() || formData.nama.length > 60) {
      setFormError('Nama acara wajib diisi (1 - 60 karakter).');
      return;
    }
    if (!formData.tanggal) {
      setFormError('Tanggal acara wajib diisi.');
      return;
    }
    if (!formData.lokasi.trim() || formData.lokasi.length > 100) {
      setFormError('Lokasi wajib diisi (1 - 100 karakter).');
      return;
    }
    const harga = parseInt(formData.harga_tiket, 10);
    if (isNaN(harga) || harga < 0) {
      setFormError('Harga tiket tidak boleh negatif.');
      return;
    }
    const kuota = parseInt(formData.kuota, 10);
    if (isNaN(kuota) || kuota < 1 || kuota > 500) {
      setFormError('Kuota harus antara 1 sampai 500.');
      return;
    }

    if (editingEvent) {
      // AC 4: Kuota tidak boleh lebih kecil dari tiket_terjual
      if (kuota < editingEvent.tiket_terjual) {
        setFormError(`Kuota tidak boleh lebih kecil dari tiket yang sudah terjual (${editingEvent.tiket_terjual}).`);
        return;
      }

      setEvents(events.map((ev) => (ev.id === editingEvent.id ? {
        ...ev,
        nama: formData.nama.trim(),
        tanggal: formData.tanggal,
        lokasi: formData.lokasi.trim(),
        harga_tiket: harga,
        kuota: kuota,
      } : ev)));
      showToast('Event berhasil diperbarui', 'success');
    } else {
      // AC 1: Tambah Event baru dengan tiket_terjual = 0
      const newEvent = {
        id: 'Ev' + Math.random().toString(36).substring(2, 8),
        nama: formData.nama.trim(),
        tanggal: formData.tanggal,
        lokasi: formData.lokasi.trim(),
        harga_tiket: harga,
        kuota: kuota,
        tiket_terjual: 0,
        dibuat_pada: new Date().toISOString(),
      };
      setEvents([newEvent, ...events]);
      showToast('Event berhasil ditambahkan', 'success');
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setEvents(events.filter((ev) => ev.id !== deleteTarget.id));
    showToast(`Event "${deleteTarget.nama}" berhasil dihapus`, 'success');
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Daftar Event</h2>
          <p className="page-subtitle">Kelola acara, jadwal, harga, dan kuota tiket.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Event</span>
        </button>
      </div>

      {/* 3-State Handling */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : events.length === 0 ? (
        <EmptyState
          title="Belum ada event"
          description="Tambahkan event workshop atau konser perdana untuk mulai menjual tiket."
          actionText="Tambah Event Baru"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="cards-grid">
          {events.map((ev) => {
            const sisaKuota = ev.kuota - ev.tiket_terjual;
            const isHabis = sisaKuota <= 0;

            // Thumbnail ilustrasi dinamis berdasarkan jenis event komunitas (seni, musik, workshop)
            const getEventBanner = (nama) => {
              const lower = (nama || '').toLowerCase();
              if (lower.includes('sablon') || lower.includes('tote') || lower.includes('lukis')) {
                return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80';
              }
              if (lower.includes('konser') || lower.includes('akustik') || lower.includes('musik')) {
                return 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80';
              }
              if (lower.includes('keramik') || lower.includes('tembikar') || lower.includes('pottery')) {
                return 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80';
              }
              return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80';
            };

            const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.lokasi)}`;

            return (
              <div key={ev.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                {/* Banner Gambar Event */}
                <div style={{ position: 'relative', width: '100%', height: '140px', overflow: 'hidden' }}>
                  <img
                    src={getEventBanner(ev.nama)}
                    alt={ev.nama}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.7) 0%, transparent 60%)'
                  }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {isHabis ? (
                      <span className="badge badge-danger">Habis</span>
                    ) : (
                      <span className="badge badge-success">
                        Sisa {sisaKuota} Kuota
                      </span>
                    )}
                  </div>
                </div>

                {/* Konten Kartu */}
                <div style={{ padding: '16px 18px 18px' }}>
                  <div className="card-header" style={{ marginBottom: '8px' }}>
                    <div>
                      <h3 className="card-title">{ev.nama}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--primary-600)' }} />
                          <strong>{ev.tanggal}</strong>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} style={{ color: 'var(--danger-solid)' }} />
                            <span>{ev.lokasi}</span>
                          </span>
                          <a
                            href={mapSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginLeft: '4px',
                              color: 'var(--primary-600)',
                              borderColor: 'var(--primary-200)'
                            }}
                          >
                            <Compass size={12} />
                            <span>Buka di Google Maps</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '14px',
                  marginTop: '10px',
                  borderTop: '1px solid var(--border-default)',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-700)' }}>
                      {formatRupiah(ev.harga_tiket)}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ({ev.tiket_terjual} / {ev.kuota} terjual)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(ev)}
                    >
                      <Edit2 size={14} />
                      <span>Ubah</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => setDeleteTarget(ev)}
                    >
                      <Trash2 size={14} />
                      <span>Hapus</span>
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Formulir Event */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Ubah Data Event' : 'Tambah Event Baru'}
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
              Nama Event <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: Workshop Sablon Tote Bag"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              maxLength={60}
              required
            />
            <span className="form-hint">Maksimal 60 karakter</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Tanggal Acara <span className="required">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Lokasi <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: Ruang Karsa, Jl. Merdeka No. 21"
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              maxLength={100}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">
                Harga Tiket (Rp) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                className="form-control"
                value={formData.harga_tiket}
                onChange={(e) => setFormData({ ...formData, harga_tiket: e.target.value })}
                required
              />
              <span className="form-hint">Isi 0 untuk event gratis</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Kuota Kursi <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="500"
                className="form-control"
                value={formData.kuota}
                onChange={(e) => setFormData({ ...formData, kuota: e.target.value })}
                required
              />
              <span className="form-hint">Antara 1 - 500 kursi</span>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {editingEvent ? 'Simpan Perubahan' : 'Simpan Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Event Ini?"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.nama}"? Data event yang sudah dihapus tidak dapat dipulihkan.`}
        confirmText="Hapus Event"
        isDanger={true}
      />
    </div>
  );
}
