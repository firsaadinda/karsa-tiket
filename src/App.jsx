import React, { useState } from 'react';
import Navbar from './components/Navbar';
import EventView from './views/EventView';
import PembeliView from './views/PembeliView';
import TiketView from './views/TiketView';
import RekapView from './views/RekapView';
import { Toast } from './components/Toast';
import { initialEvents, initialPembeli, initialTiket } from './data/mockData';
import { Sliders, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('event');

  // Shared Data States
  const [events, setEvents] = useState(initialEvents);
  const [pembeliList, setPembeliList] = useState(initialPembeli);
  const [tiketList, setTiketList] = useState(initialTiket);

  // 3-State Simulation (Bisa diuji langsung oleh penguji/mentor)
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSimulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Data berhasil dimuat kembali', 'success');
    }, 1500);
  };

  const handleSimulateError = () => {
    setIsError(!isError);
    if (!isError) {
      showToast('Simulasi koneksi terputus (Error State aktif)', 'error');
    } else {
      showToast('Status normal dikembalikan', 'success');
    }
  };

  const handleResetData = () => {
    setEvents(initialEvents);
    setPembeliList(initialPembeli);
    setTiketList(initialTiket);
    setIsError(false);
    showToast('Seluruh data contoh berhasil direset ke awal', 'success');
  };

  return (
    <>
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Responsive Content */}
      <main className="app-container">
        {/* State Simulation Bar untuk Pengujian Mandiri */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.8rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '600' }}>
            <Sliders size={14} />
            Pengujian 3-State:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSimulateLoading}
              disabled={isLoading}
            >
              Uji Loading
            </button>
            <button
              type="button"
              className={`btn btn-sm ${isError ? 'btn-danger' : 'btn-secondary'}`}
              onClick={handleSimulateError}
            >
              {isError ? 'Matikan Error' : 'Uji Error'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetData}
              title="Reset data ke awal skema"
            >
              <RefreshCw size={13} />
              <span>Reset Data</span>
            </button>
          </div>
        </div>

        {/* View Switcher Sesuai Tab Aktif */}
        {activeTab === 'event' && (
          <EventView
            events={events}
            setEvents={setEvents}
            showToast={showToast}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => setIsError(false)}
          />
        )}

        {activeTab === 'pembeli' && (
          <PembeliView
            pembeliList={pembeliList}
            setPembeliList={setPembeliList}
            showToast={showToast}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => setIsError(false)}
          />
        )}

        {activeTab === 'tiket' && (
          <TiketView
            tiketList={tiketList}
            setTiketList={setTiketList}
            events={events}
            setEvents={setEvents}
            pembeliList={pembeliList}
            showToast={showToast}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => setIsError(false)}
          />
        )}

        {activeTab === 'rekap' && (
          <RekapView
            events={events}
            tiketList={tiketList}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => setIsError(false)}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
