import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        qaLab: fileURLToPath(new URL('./qa-lab/index.html', import.meta.url))
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    open: false
  }
})
