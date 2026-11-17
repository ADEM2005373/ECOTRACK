/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Empty prefix: also reads API_PROXY_TARGET, which is never exposed to the browser.
  const env = loadEnv(mode, __dirname, '');
  const proxyTarget = env.API_PROXY_TARGET;
  // Optional override for bi-api (ECO-42) until the gateway routes /api/v1/bi.
  const biProxyTarget = env.BI_API_PROXY_TARGET;
  const proxy = {
    ...(biProxyTarget ? { '/api/v1/bi': { target: biProxyTarget, changeOrigin: true } } : {}),
    ...(proxyTarget ? { '/api': { target: proxyTarget, changeOrigin: true } } : {}),
  };

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^react$/, replacement: path.resolve(__dirname, 'node_modules/react') },
        { find: /^react-dom$/, replacement: path.resolve(__dirname, 'node_modules/react-dom') },
        { find: /^react-router-dom$/, replacement: path.resolve(__dirname, 'node_modules/react-router-dom') },
        { find: '@', replacement: path.resolve(__dirname, './src') },
      ],
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // The backend services send no CORS headers: in development the browser
      // calls /api on the Vite origin and Vite forwards it to the gateway.
      // First match wins: /api/v1/bi is listed before /api.
      proxy: Object.keys(proxy).length > 0 ? proxy : undefined,
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['src/test/setup.ts'],
      server: {
        deps: {
          inline: [/react/, /react-dom/, /react-router/],
        },
      },
    },
  };
});
