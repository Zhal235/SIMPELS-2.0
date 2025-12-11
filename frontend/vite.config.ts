import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  // Pastikan dev server berjalan di port 5173 dengan strictPort
  server: { 
    host: '0.0.0.0', 
    port: 5173, 
    strictPort: true, 
    open: false,
    allowedHosts: [
      'simpels.saza.sch.id',
      '.saza.sch.id', // Allow all subdomains
    ]
  },
  preview: { port: 4173 },
  resolve: {
    // Prioritaskan resolusi ke file .tsx terlebih dahulu
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Optimisasi dependency agar re-optimize konsisten
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})