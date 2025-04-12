import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optymalizacja budowy projektu
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
  },
  // Serwer deweloperski
  server: {
    port: 3000,
    open: true,
  }
})