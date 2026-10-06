import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Otomatis mengaktifkan akses network lokal (HP/perangkat lain di Wi-Fi yang sama)
    port: 5173,
  },
})
