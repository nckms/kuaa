import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Por padrão o `npm run dev` conversa com a API LOCAL. Apontar para a API
  // publicada (e portanto para o banco de produção) exige escolha explícita:
  //   VITE_DEV_API_PROXY=https://kuaa-tcc-api-production-01b2.up.railway.app npm run dev
  const target = env.VITE_DEV_API_PROXY || 'http://localhost:3333'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target, changeOrigin: true },
      },
    },
  }
})
