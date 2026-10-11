import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    fs: {
      allow: [path.resolve(root, '..')],
    },
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
})
