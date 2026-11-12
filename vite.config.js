import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: served from https://brinis-aya.github.io/aeria-dashboard/ on GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: process.env.PAGES_BASE ?? '/',
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.js'], include: ['src/**/*.test.{js,jsx}'] },
})
