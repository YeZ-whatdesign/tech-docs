import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/docs/admin/',
  server: {
    port: 3005,
    proxy: {
      '/docs/api': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docs\/api/, '/api')
      }
    }
  },
  preview: {
    port: 3005,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'docs.what-tech.cn',
      'what-tech.cn',
      'www.what-tech.cn'
    ]
  },
  build: {
    outDir: 'dist'
  }
})