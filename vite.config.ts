/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Production сборката се публикува в GitHub Pages на адрес
// https://krgeorgieva80-crypto.github.io/math-amusement-park/
// При разработка (npm run dev) приложението работи от корена.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/math-amusement-park/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
