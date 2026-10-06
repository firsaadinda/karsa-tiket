import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import EventView from './views/EventView';
import PembeliView from './views/PembeliView';
import TiketView from './views/TiketView';
import RekapView from './views/RekapView';
import { Toast } from './components/Toast';
import {
  subscribeEvents,
  subscribePembeli,
  subscribeTiket,
  seedInitialDataIfEmpty
} from './services/firestoreService';

export default function App() {
  const [activeTab, setActiveTab] = useState('event');

  // Shared Data States dari Cloud Firestore
  const [events, setEvents] = useState([]);
  const [pembeliList, setPembeliList] = useState([]);
  const [tiketList, setTiketList] = useState([]);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);

    // 1. Jalankan auto-seed ke Firestore bila koleksi masih kosong
    seedInitialDataIfEmpty();

    // 2. Berlangganan (realtime subscription) ke koleksi Firestore
    let unsubEvents = () => {};
    let unsubPembeli = () => {};
    let unsubTiket = () => {};

    try {
      unsubEvents = subscribeEvents(
        (data) => {
          setEvents(data);
          setIsLoading(false);
        },
        (err) => {
          console.error('Firestore events subscription error:', err);
          setIsError(true);
          setIsLoading(false);
        }
      );

      unsubPembeli = subscribePembeli(
        (data) => {
          setPembeliList(data);
        },
        (err) => {
          console.error('Firestore pembeli subscription error:', err);
          setIsError(true);
          setIsLoading(false);
        }
      );

      unsubTiket = subscribeTiket(
        (data) => {
          setTiketList(data);
        },
        (err) => {
          console.error('Firestore tiket subscription error:', err);
          setIsError(true);
          setIsLoading(false);
        }
      );
    } catch (e) {
      console.error('Gagal menghubungkan ke Firestore:', e);
      setIsError(true);
      setIsLoading(false);
    }

    return () => {
      unsubEvents();
      unsubPembeli();
      unsubTiket();
    };
  }, []);

  const handleRetry = () => {
    setIsError(false);
    setIsLoading(true);
    seedInitialDataIfEmpty();
  };

  return (
    <>
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Responsive Content */}
      <main className="app-container">
        {/* View Switcher Sesuai Tab Aktif */}
        {activeTab === 'event' && (
          <EventView
            events={events}
            showToast={showToast}
            isLoading={isLoading}
            isError={isError}
            onRetry={handleRetry}
          />
        )}

        {activeTab === 'pembeli' && (
          <PembeliView
            pembeliList={pembeliList}
            showToast={showToast}
            isLoading={isLoading}
            isError={isError}
            onRetry={handleRetry}
          />
        )}

        {activeTab === 'tiket' && (
          <TiketView
            tiketList={tiketList}
            events={events}
            pembeliList={pembeliList}
            showToast={showToast}
            isLoading={isLoading}
            isError={isError}
            onRetry={handleRetry}
          />
        )}

        {activeTab === 'rekap' && (
          <RekapView
            events={events}
            tiketList={tiketList}
            isLoading={isLoading}
            isError={isError}
            onRetry={handleRetry}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
