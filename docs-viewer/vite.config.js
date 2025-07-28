import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 移除 base 路径，让应用在根路径运行
  plugins: [vue()],
  server: {
    port: 3007,
    proxy: {
      '/api': {
        target: 'http://localhost:3006',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 3007,
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