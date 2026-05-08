import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/meshtrack-studio/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    manifest: false,
  },
  plugins: [react()],
})
