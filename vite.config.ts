import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as any,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api-php': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-php/, '')
        },
        '/wamp-api': {
          target: process.env.VITE_WAMP_API_URL || 'http://localhost/nsaibia-api/wamp-api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/wamp-api/, ''),
        }
      }
    },
  };
});
