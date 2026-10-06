import React, { useState } from 'react';
import { Plus, Calendar, MapPin, Tag, Users, Edit2, Trash2, ExternalLink, Compass } from 'lucide-react';
import { formatRupiah } from '../data/mockData';
import { Modal, ConfirmDialog } from '../components/Modal';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { addEventData, updateEventData, deleteEventData } from '../services/firestoreService';

export default function EventView({ events, showToast, isLoading, isError, onRetry }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
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

    try {
      setIsSubmitting(true);
      if (editingEvent) {
        // AC 4: Kuota tidak boleh lebih kecil dari tiket_terjual
        if (kuota < editingEvent.tiket_terjual) {
          setFormError(`Kuota tidak boleh lebih kecil dari tiket yang sudah terjual (${editingEvent.tiket_terjual}).`);
          setIsSubmitting(false);
          return;
        }

        await updateEventData(editingEvent.id, {
          nama: formData.nama.trim(),
          tanggal: formData.tanggal,
          lokasi: formData.lokasi.trim(),
          harga_tiket: harga,
          kuota: kuota,
        });
        showToast('Event berhasil diperbarui di Firestore', 'success');
      } else {
        // AC 1: Tambah Event baru dengan tiket_terjual = 0
        await addEventData({
          nama: formData.nama.trim(),
          tanggal: formData.tanggal,
          lokasi: formData.lokasi.trim(),
          harga_tiket: harga,
          kuota: kuota,
        });
        showToast('Event berhasil disimpan ke Firestore', 'success');
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving event:', err);
      showToast('Gagal menyimpan event: ' + (err.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEventData(deleteTarget.id);
      showToast(`Event "${deleteTarget.nama}" berhasil dihapus dari Firestore`, 'success');
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('Gagal menghapus event: ' + (err.message || 'Terjadi kesalahan'), 'error');
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      {/* Kotak Header Banner / Hero Card dengan Nuansa Cerah & Hidup */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(246, 249, 255, 0.95) 0%, rgba(238, 244, 255, 0.88) 45%, rgba(243, 251, 255, 0.95) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(215, 226, 255, 0.95)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 24px',
        marginBottom: '24px',
        boxShadow: '0 12px 28px -5px rgba(99, 102, 241, 0.12), 0 4px 12px -2px rgba(14, 165, 233, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            color: 'var(--primary-700)',
            border: '1px solid var(--primary-200)',
            padding: '3px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem',
            fontWeight: '700',
            letterSpacing: '0.02em',
            marginBottom: '8px',
            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.08)'
          }}>
            Ruang Seni & Kolaborasi
          </span>
          <h2 style={{
            fontSize: '1.55rem',
            fontWeight: '800',
            color: '#312e81',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>
            Jelajahi Acara & Workshop
          </h2>
          <p style={{
            maxWidth: '620px',
            lineHeight: '1.55',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Temukan jadwal workshop kreatif pilihan, pertunjukan musik langsung, dan agenda pameran terbaik dengan kuota tiket yang selalu terupdate.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ flexShrink: 0, padding: '10px 18px' }}
        >
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
              if (lower.includes('sablon') || lower.includes('tote')) {
                return ['/sablon-tote-bag.jpg?v=6', '/sablon-tote-bag-2.jpg?v=2'];
              }
              if (lower.includes('lukis')) {
                return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80';
              }
              if (lower.includes('konser') || lower.includes('akustik') || lower.includes('musik')) {
                return ['/konser-1.jpg?v=2', '/konser-2.jpg?v=2'];
              }
              if (lower.includes('keramik') || lower.includes('tembikar') || lower.includes('pottery')) {
                return ['/keramik-1.jpg?v=2', '/keramik-2.jpg?v=2'];
              }
              return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80';
            };

            const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.lokasi)}`;
            const bannerSrc = getEventBanner(ev.nama);

            return (
              <div key={ev.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                {/* Banner Gambar Event */}
                <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-default)' }}>
                  {Array.isArray(bannerSrc) ? (
                    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                      <img src={bannerSrc[0]} alt={`${ev.nama} 1`} style={{ width: '50%', height: '100%', objectFit: 'cover' }} />
                      <img src={bannerSrc[1]} alt={`${ev.nama} 2`} style={{ width: '50%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <img
                      src={bannerSrc}
                      alt={ev.nama}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
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
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : (editingEvent ? 'Simpan Perubahan' : 'Simpan Event')}
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
