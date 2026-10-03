import React from 'react';
import { PackageOpen, AlertOctagon, RotateCw, Plus } from 'lucide-react';

export function LoadingSkeleton({ count = 3, type = 'card' }) {
  return (
    <div className="cards-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="skeleton" style={{ width: '45%', height: '24px' }}></div>
            <div className="skeleton" style={{ width: '20%', height: '20px', borderRadius: '999px' }}></div>
          </div>
          <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '10px' }}></div>
          <div className="skeleton" style={{ width: '50%', height: '16px', marginBottom: '16px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="skeleton" style={{ width: '30%', height: '20px' }}></div>
            <div className="skeleton" style={{ width: '25%', height: '28px', borderRadius: '6px' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title = 'Belum Ada Data', description = 'Belum ada data yang tercatat di sistem.', onAction, actionText = 'Tambah Data' }) {
  return (
    <div className="state-box">
      <div className="state-icon empty">
        <PackageOpen size={24} />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-desc">{description}</p>
      {onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction} style={{ marginTop: '8px' }}>
          <Plus size={16} />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}

export function ErrorState({ title = 'Gagal Memuat Data', message = 'Terjadi kesalahan saat memproses data. Periksa koneksi internet Anda.', onRetry }) {
  return (
    <div className="state-box">
      <div className="state-icon error">
        <AlertOctagon size={24} />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-desc">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry} style={{ marginTop: '8px' }}>
          <RotateCw size={16} />
          <span>Coba Lagi</span>
        </button>
      )}
    </div>
  );
}
