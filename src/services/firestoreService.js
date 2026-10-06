import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { initialEvents, initialPembeli, initialTiket } from '../data/mockData';

// ==========================================
// 1. MODUL EVENT
// ==========================================

export function subscribeEvents(onSuccess, onError) {
  const colRef = collection(db, 'event');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        // Format timestamp fallback
        dibuat_pada: d.data().dibuat_pada?.toDate?.()?.toISOString() || d.data().dibuat_pada || new Date().toISOString(),
      }));
      onSuccess(list);
    },
    (err) => {
      console.error('Error fetching events:', err);
      if (onError) onError(err);
    }
  );
}

export async function addEventData(eventData) {
  const colRef = collection(db, 'event');
  const docRef = await addDoc(colRef, {
    nama: eventData.nama,
    tanggal: eventData.tanggal,
    lokasi: eventData.lokasi,
    harga_tiket: Number(eventData.harga_tiket),
    kuota: Number(eventData.kuota),
    tiket_terjual: 0,
    dibuat_pada: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEventData(eventId, eventData) {
  const docRef = doc(db, 'event', eventId);
  await updateDoc(docRef, {
    nama: eventData.nama,
    tanggal: eventData.tanggal,
    lokasi: eventData.lokasi,
    harga_tiket: Number(eventData.harga_tiket),
    kuota: Number(eventData.kuota),
  });
}

export async function deleteEventData(eventId) {
  const docRef = doc(db, 'event', eventId);
  await deleteDoc(docRef);
}

// ==========================================
// 2. MODUL PEMBELI
// ==========================================

export function subscribePembeli(onSuccess, onError) {
  const colRef = collection(db, 'pembeli');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        dibuat_pada: d.data().dibuat_pada?.toDate?.()?.toISOString() || d.data().dibuat_pada || new Date().toISOString(),
      }));
      onSuccess(list);
    },
    (err) => {
      console.error('Error fetching pembeli:', err);
      if (onError) onError(err);
    }
  );
}

export async function checkPembeliExists(noWhatsapp) {
  const docRef = doc(db, 'pembeli', noWhatsapp);
  const snap = await getDoc(docRef);
  return snap.exists();
}

export async function addPembeliData(pembeliData) {
  // Sesuai Skema Firestore: ID Dokumen memakai no_whatsapp
  const docRef = doc(db, 'pembeli', pembeliData.no_whatsapp);
  await setDoc(docRef, {
    nama: pembeliData.nama,
    no_whatsapp: pembeliData.no_whatsapp,
    email: pembeliData.email,
    dibuat_pada: serverTimestamp(),
  });
}

export async function updatePembeliData(noWhatsapp, pembeliData) {
  const docRef = doc(db, 'pembeli', noWhatsapp);
  await updateDoc(docRef, {
    nama: pembeliData.nama,
    email: pembeliData.email,
  });
}

export async function deletePembeliData(noWhatsapp) {
  const docRef = doc(db, 'pembeli', noWhatsapp);
  await deleteDoc(docRef);
}

// ==========================================
// 3. MODUL TIKET
// ==========================================

export function subscribeTiket(onSuccess, onError) {
  const colRef = collection(db, 'tiket');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        dibuat_pada: d.data().dibuat_pada?.toDate?.()?.toISOString() || d.data().dibuat_pada || new Date().toISOString(),
      }));
      onSuccess(list);
    },
    (err) => {
      console.error('Error fetching tiket:', err);
      if (onError) onError(err);
    }
  );
}

export async function addTiketData(tiketData) {
  const harga = Number(tiketData.harga_tiket);
  const qty = Number(tiketData.jumlah_tiket);
  const total = harga * qty; // Total selalu sesuai rumus

  // 1. Simpan dokumen tiket
  const colRef = collection(db, 'tiket');
  const docRef = await addDoc(colRef, {
    event_id: tiketData.event_id,
    nama_event: tiketData.nama_event,
    tanggal_event: tiketData.tanggal_event,
    pembeli_id: tiketData.pembeli_id,
    nama_pembeli: tiketData.nama_pembeli,
    harga_tiket: harga,
    jumlah_tiket: qty,
    total: total,
    status: 'menunggu_bayar',
    metode_pembayaran: tiketData.metode_pembayaran || null,
    bukti_transfer_nama: tiketData.bukti_transfer_nama || null,
    catatan_bayar: tiketData.catatan_bayar || null,
    dibuat_pada: serverTimestamp(),
  });

  // 2. Tambah tiket_terjual pada event terkait (increment)
  try {
    const eventRef = doc(db, 'event', tiketData.event_id);
    await updateDoc(eventRef, {
      tiket_terjual: increment(qty)
    });
  } catch (err) {
    console.warn('Gagal increment tiket_terjual event:', err);
  }

  return docRef.id;
}

export async function updateTiketStatusData(tiketId, newStatus, extraData = {}) {
  const docRef = doc(db, 'tiket', tiketId);
  await updateDoc(docRef, {
    status: newStatus,
    ...extraData
  });
}

export async function cancelTiketData(tiketId, eventId, jumlahTiket) {
  // 1. Ubah status tiket jadi dibatalkan
  const docRef = doc(db, 'tiket', tiketId);
  await updateDoc(docRef, {
    status: 'dibatalkan'
  });

  // 2. Kembalikan kuota event (decrement tiket_terjual)
  if (eventId) {
    try {
      const eventRef = doc(db, 'event', eventId);
      await updateDoc(eventRef, {
        tiket_terjual: increment(-Number(jumlahTiket))
      });
    } catch (err) {
      console.warn('Gagal kurangi tiket_terjual event:', err);
    }
  }
}

export async function deleteTiketData(tiketId, eventId, jumlahTiket, shouldRestoreQuota) {
  // Jika tiket belum dibatalkan, kembalikan kuota sebelum dihapus
  if (shouldRestoreQuota && eventId) {
    try {
      const eventRef = doc(db, 'event', eventId);
      await updateDoc(eventRef, {
        tiket_terjual: increment(-Number(jumlahTiket))
      });
    } catch (err) {
      console.warn('Gagal kurangi tiket_terjual saat hapus tiket:', err);
    }
  }

  const docRef = doc(db, 'tiket', tiketId);
  await deleteDoc(docRef);
}

// ==========================================
// 4. SEED DATA AWAL OTOMATIS (Bila Firestore Masih Kosong)
// ==========================================
export async function seedInitialDataIfEmpty() {
  try {
    const eventSnap = await getDocs(collection(db, 'event'));
    if (!eventSnap.empty) {
      console.log('Koleksi Firestore sudah terisi, lewati seeding.');
      return;
    }

    console.log('Mengisi data awal ke Cloud Firestore...');

    // Seed Events
    for (const ev of initialEvents) {
      const evRef = doc(db, 'event', ev.id);
      await setDoc(evRef, {
        nama: ev.nama,
        tanggal: ev.tanggal,
        lokasi: ev.lokasi,
        harga_tiket: Number(ev.harga_tiket),
        kuota: Number(ev.kuota),
        tiket_terjual: Number(ev.tiket_terjual),
        dibuat_pada: serverTimestamp(),
      });
    }

    // Seed Pembeli
    for (const p of initialPembeli) {
      const pRef = doc(db, 'pembeli', p.no_whatsapp);
      await setDoc(pRef, {
        nama: p.nama,
        no_whatsapp: p.no_whatsapp,
        email: p.email,
        dibuat_pada: serverTimestamp(),
      });
    }

    // Seed Tiket (mematuhi state machine aturan Firestore: buat menunggu_bayar dulu)
    for (const t of initialTiket) {
      const tRef = doc(db, 'tiket', t.id);
      await setDoc(tRef, {
        event_id: t.event_id,
        nama_event: t.nama_event,
        tanggal_event: t.tanggal_event,
        pembeli_id: t.pembeli_id,
        nama_pembeli: t.nama_pembeli,
        harga_tiket: Number(t.harga_tiket),
        jumlah_tiket: Number(t.jumlah_tiket),
        total: Number(t.harga_tiket) * Number(t.jumlah_tiket),
        status: 'menunggu_bayar',
        dibuat_pada: serverTimestamp(),
      });

      // Transisi bertahap sesuai status awal contoh
      if (t.status === 'lunas' || t.status === 'hadir') {
        await updateDoc(tRef, {
          status: 'lunas',
          metode_pembayaran: t.metode_pembayaran || 'Transfer Bank',
          bukti_transfer_nama: t.bukti_transfer_nama || null,
          catatan_bayar: t.catatan_bayar || null,
        });
      }

      if (t.status === 'hadir') {
        await updateDoc(tRef, {
          status: 'hadir',
        });
      }
    }

    console.log('Data awal Karsa Tiket berhasil di-seed ke Firestore!');
  } catch (err) {
    console.warn('Gagal auto-seed Firestore:', err);
  }
}
