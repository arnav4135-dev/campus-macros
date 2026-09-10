import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api is proxied to the local server so the browser sees one origin.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: process.env.API_URL || 'http://localhost:4000', changeOrigin: true } } },
  preview: { proxy: { '/api': { target: process.env.API_URL || 'http://localhost:4000', changeOrigin: true } } },
});
