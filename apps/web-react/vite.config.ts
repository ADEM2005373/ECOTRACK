/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Empty prefix: also reads API_PROXY_TARGET, which is never exposed to the browser.
  const proxyTarget = loadEnv(mode, __dirname, '').API_PROXY_TARGET;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // The backend services send no CORS headers: in development the browser
      // calls /api on the Vite origin and Vite forwards it to the gateway.
      proxy: proxyTarget ? { '/api': { target: proxyTarget, changeOrigin: true } } : undefined,
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['src/test/setup.ts'],
    },
  };
});
