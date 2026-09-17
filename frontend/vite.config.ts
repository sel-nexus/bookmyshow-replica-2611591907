import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** Configure React, Vitest, and local API proxying. */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
