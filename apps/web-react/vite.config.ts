/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Empty prefix: also reads API_PROXY_TARGET, which is never exposed to the browser.
  const proxyTarget = loadEnv(mode, __dirname, '').API_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [react()],
    css: {
      postcss: path.resolve(__dirname, 'postcss.config.js'),
    },
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
      strictPort: true,
      host: '0.0.0.0',
      // Forward /api to Nginx gateway (http://localhost:8080)
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
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
