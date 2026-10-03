import React, { useState } from 'react';
import { Plus, Search, Phone, Mail, User, Edit2, Trash2 } from 'lucide-react';
import { Modal, ConfirmDialog } from '../components/Modal';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/StateViews';

export default function PembeliView({ pembeliList, setPembeliList, showToast, isLoading, isError, onRetry }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPembeli, setEditingPembeli] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    no_whatsapp: '',
    email: '',
  });
  const [formError, setFormError] = useState('');

  const handleOpenAdd = () => {
    setEditingPembeli(null);
    setFormData({
      nama: '',
      no_whatsapp: '',
      email: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pembeli) => {
    setEditingPembeli(pembeli);
    setFormData({
      nama: pembeli.nama,
      no_whatsapp: pembeli.no_whatsapp,
      email: pembeli.email,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanNama = formData.nama.trim();
    const cleanWa = formData.no_whatsapp.trim();
    const cleanEmail = formData.email.trim();

    // Validasi Sesuai PRD & Skema
    if (!cleanNama || cleanNama.length > 60) {
      setFormError('Nama pembeli wajib diisi (1 - 60 karakter).');
      return;
    }

    // Aturan no_whatsapp: Diawali 08, total 10 sampai 13 angka
    const waRegex = /^08[0-9]{8,11}$/;
    if (!waRegex.test(cleanWa)) {
      setFormError('Nomor WhatsApp harus diawali "08" dan terdiri dari 10 - 13 angka.');
      return;
    }

    // Aturan email: Mengandung @, maks 80 karakter
    if (!cleanEmail.includes('@') || cleanEmail.length > 80) {
      setFormError('Format email tidak sah (harus mengandung "@" dan maksimal 80 karakter).');
      return;
    }

    if (editingPembeli) {
      // Update data pembeli
      setPembeliList(pembeliList.map((p) => (p.id === editingPembeli.id ? {
        ...p,
        nama: cleanNama,
        email: cleanEmail,
      } : p)));
      showToast('Data pembeli berhasil diperbarui', 'success');
    } else {
      // AC 2: Cek apakah no_whatsapp sudah terdaftar
      const exists = pembeliList.some((p) => p.no_whatsapp === cleanWa);
      if (exists) {
        setFormError('Nomor WhatsApp sudah terdaftar');
        return;
      }

      const newPembeli = {
        id: cleanWa, // Document ID menggunakan no_whatsapp
        nama: cleanNama,
        no_whatsapp: cleanWa,
        email: cleanEmail,
        dibuat_pada: new Date().toISOString(),
      };
      setPembeliList([newPembeli, ...pembeliList]);
      showToast('Pembeli baru berhasil disimpan', 'success');
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setPembeliList(pembeliList.filter((p) => p.id !== deleteTarget.id));
    showToast(`Data pembeli "${deleteTarget.nama}" berhasil dihapus`, 'success');
    setDeleteTarget(null);
  };

  // AC 4: Filter pencarian realtime berdasarkan nama atau nomor WhatsApp
  const filteredPembeli = pembeliList.filter((p) => {
    const term = searchTerm.toLowerCase();
    return p.nama.toLowerCase().includes(term) || p.no_whatsapp.includes(term);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Daftar Pembeli</h2>
          <p className="page-subtitle">Kelola master kontak pembeli tiket workshop & konser.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Pembeli</span>
        </button>
      </div>

      {/* Kolom Cari Realtime */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Cari pembeli berdasarkan nama atau no. WhatsApp (contoh: 0813...)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
        <Search
          size={18}
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
      </div>

      {/* 3-State Handling */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : pembeliList.length === 0 ? (
        <EmptyState
          title="Belum ada pembeli"
          description="Daftar pembeli masih kosong. Tambahkan kontak pertama Anda."
          actionText="Tambah Pembeli"
          onAction={handleOpenAdd}
        />
      ) : filteredPembeli.length === 0 ? (
        <div className="state-box">
          <h4 className="state-title">Tidak Ditemukan</h4>
          <p className="state-desc">Tidak ada data pembeli yang sesuai dengan kata kunci "{searchTerm}".</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSearchTerm('')}>
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredPembeli.map((p) => (
            <div key={p.id} className="card">
              <div className="card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}>
                      {p.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="card-title">{p.nama}</h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} style={{ color: 'var(--primary-600)' }} />
                      <code>{p.no_whatsapp}</code>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{p.email}</span>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(p)}
                  >
                    <Edit2 size={14} />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Formulir Pembeli */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPembeli ? 'Ubah Data Pembeli' : 'Tambah Pembeli Baru'}
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
              Nama Lengkap <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: Nadia Putri"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              maxLength={60}
              required
            />
            <span className="form-hint">Maksimal 60 karakter</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Nomor WhatsApp <span className="required">*</span>
            </label>
            <input
              type="tel"
              className="form-control"
              placeholder="Contoh: 081355512345"
              value={formData.no_whatsapp}
              onChange={(e) => setFormData({ ...formData, no_whatsapp: e.target.value })}
              disabled={!!editingPembeli} // ID Dokumen Firestore tidak boleh diubah
              required
            />
            <span className="form-hint">
              {editingPembeli ? 'Nomor WhatsApp berfungsi sebagai ID dan tidak dapat diubah.' : 'Diawali 08, 10 - 13 digit angka'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="Contoh: nadia.putri@contoh.id"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              maxLength={80}
              required
            />
            <span className="form-hint">Harus mengandung karakter @, maksimal 80 karakter</span>
          </div>

          <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {editingPembeli ? 'Simpan Perubahan' : 'Simpan Pembeli'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Pembeli Ini?"
        message={`Apakah Anda yakin ingin menghapus data kontak "${deleteTarget?.nama}"?`}
        confirmText="Hapus Pembeli"
        isDanger={true}
      />
    </div>
  );
}
