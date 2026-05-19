import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const backendTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error(`[proxy error] ${req.method} ${req.url} →`, err.message);
          });
          proxy.on('proxyRes', (res, req) => {
            if (res.statusCode >= 500) {
              console.error(`[proxy 5xx] ${req.method} ${req.url} → ${res.statusCode}`);
            }
          });
        },
      },
      '/socket.io': {
        target: backendTarget,
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['**/e2e-tests/**', '**/node_modules/**', '**/dist/**'],
  },
});
