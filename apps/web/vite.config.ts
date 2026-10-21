import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://kuaa-tcc-api-production-01b2.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})
