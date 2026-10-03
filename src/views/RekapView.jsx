import React, { useState } from 'react';
import { Ticket, Users, DollarSign, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../data/mockData';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/StateViews';

export default function RekapView({ events, tiketList, isLoading, isError, onRetry }) {
  const [selectedEventId, setSelectedEventId] = useState(events.length > 0 ? events[0].id : '');

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Filter tiket khusus untuk event yang dipilih
  const eventTiket = activeEvent
    ? tiketList.filter((t) => t.event_id === activeEvent.id)
    : [];

  // Hitung KPI
  const tiketTerjual = activeEvent ? activeEvent.tiket_terjual : 0;
  const sisaKuota = activeEvent ? activeEvent.kuota - activeEvent.tiket_terjual : 0;
  const persentaseTerjual = activeEvent && activeEvent.kuota > 0
    ? Math.min(100, Math.round((tiketTerjual / activeEvent.kuota) * 100))
    : 0;

  // AC 2: Pendapatan hanya dihitung dari tiket dengan status 'lunas' dan 'hadir'
  // Tiket 'menunggu_bayar' dan 'dibatalkan' TIDAK ikut dihitung
  const totalPendapatan = eventTiket
    .filter((t) => t.status === 'lunas' || t.status === 'hadir')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Total peserta hadir (check-in)
  const totalHadir = eventTiket
    .filter((t) => t.status === 'hadir')
    .reduce((acc, curr) => acc + (curr.jumlah_tiket || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Rekap Penjualan & Kehadiran</h2>
          <p className="page-subtitle">Ringkasan performa event, pendapatan terverifikasi, dan kehadiran peserta.</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={2} />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : events.length === 0 ? (
        <EmptyState
          title="Belum Ada Event"
          description="Tambahkan event terlebih dahulu di menu Event untuk melihat rekapitulasi."
        />
      ) : (
        <>
          {/* Selector Event */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Pilih Event untuk Ditinjau:
            </label>
            <select
              className="form-control"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ fontWeight: '600' }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nama} ({ev.tanggal}) - Kuota: {ev.kuota}
                </option>
              ))}
            </select>
          </div>

          {activeEvent && (
            <>
              {/* Progress Bar Kuota */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Kapasitas Kursi Terisi
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: persentaseTerjual >= 100 ? 'var(--danger-solid)' : 'var(--primary-600)' }}>
                    {persentaseTerjual}% ({tiketTerjual} / {activeEvent.kuota})
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '10px',
                  background: '#e2e8f0',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${persentaseTerjual}%`,
                    height: '100%',
                    background: persentaseTerjual >= 100 ? 'var(--danger-solid)' : 'var(--primary-gradient)',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                {sisaKuota === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--danger-text)', marginTop: '8px', fontWeight: '600' }}>
                    * Seluruh kuota untuk acara ini sudah habis terjual.
                  </p>
                )}
              </div>

              {/* 4 Kartu KPI */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {/* 1. Tiket Terjual */}
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', marginBottom: '8px' }}>
                    <Ticket size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>Tiket Terjual</span>
                  </div>
                  <strong style={{ fontSize: '1.6rem', color: 'var(--text-main)' }}>
                    {tiketTerjual}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                    dari total {activeEvent.kuota} kursi
                  </span>
                </div>

                {/* 2. Sisa Kuota */}
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-solid)', marginBottom: '8px' }}>
                    <Users size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>Sisa Kuota</span>
                  </div>
                  <strong style={{ fontSize: '1.6rem', color: sisaKuota <= 0 ? 'var(--danger-solid)' : 'var(--text-main)' }}>
                    {sisaKuota}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                    kursi tersedia
                  </span>
                </div>

                {/* 3. Total Pendapatan */}
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-solid)', marginBottom: '8px' }}>
                    <DollarSign size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>Pendapatan</span>
                  </div>
                  <strong style={{ fontSize: '1.35rem', color: 'var(--success-text)' }}>
                    {formatRupiah(totalPendapatan)}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>
                    dari tiket Lunas & Hadir
                  </span>
                </div>

                {/* 4. Kehadiran Check-in */}
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--info-solid)', marginBottom: '8px' }}>
                    <CheckCircle2 size={20} />
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>Peserta Hadir</span>
                  </div>
                  <strong style={{ fontSize: '1.6rem', color: 'var(--info-text)' }}>
                    {totalHadir}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                    telah check-in di lokasi
                  </span>
                </div>
              </div>

              {/* Rincian Transaksi Event */}
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '14px' }}>
                  Rincian Transaksi Tiket ({eventTiket.length})
                </h3>

                {eventTiket.length === 0 ? (
                  <EmptyState
                    title="Belum Ada Tiket untuk Event Ini"
                    description="Belum ada transaksi pembelian tiket yang tercatat untuk acara ini."
                  />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-default)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '8px 12px' }}>Pembeli</th>
                          <th style={{ padding: '8px 12px' }}>Jumlah</th>
                          <th style={{ padding: '8px 12px' }}>Total</th>
                          <th style={{ padding: '8px 12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventTiket.map((t) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <strong>{t.nama_pembeli}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.pembeli_id}</span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>{t.jumlah_tiket} tiket</td>
                            <td style={{ padding: '10px 12px', fontWeight: '600' }}>{formatRupiah(t.total)}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span className={`badge ${
                                t.status === 'lunas' ? 'badge-info' :
                                t.status === 'hadir' ? 'badge-success' :
                                t.status === 'menunggu_bayar' ? 'badge-warning' : 'badge-danger'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
