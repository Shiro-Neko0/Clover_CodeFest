import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Using explicit 127.0.0.1 prevents Node IPv6 (::1) lookup fallback issues on login failure
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});