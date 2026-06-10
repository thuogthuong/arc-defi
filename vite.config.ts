import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: { global: 'globalThis' },
  server: {
    port: 5173,
    proxy: {
      '/circle-api': {
        target: 'https://api.circle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/circle-api/, ''),
        headers: {
          'origin': 'https://api.circle.com',
        },
      },
    },
  },
})
