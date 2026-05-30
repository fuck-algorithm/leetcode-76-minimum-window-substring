import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/leetcode-76-minimum-window-substring/',
  server: {
    port: 48844,
    host: '127.0.0.1'
  }
})
