import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
    environmentMatchGlobs: [
      ['tests/component/**', 'jsdom'],
      ['tests/unit/**', 'node'],
    ],
    globals: true,
  },
})
