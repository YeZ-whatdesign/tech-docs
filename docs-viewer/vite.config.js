import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 移除 base 配置，因为nginx直接代理到根路径
  plugins: [vue()],
  server: {
    port: 3007,
    proxy: {
      '/docs/api': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docs\/api/, '/api')
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