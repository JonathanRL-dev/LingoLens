import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Tambahkan domain tunnel lain ke daftar ini bila diperlukan.
    allowedHosts: ['.trycloudflare.com'],
  },
});
