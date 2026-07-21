import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, 'apps/collector-v0.1'),
  publicDir: path.resolve(__dirname, 'apps/web/public'),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4177',
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/v0.1.2'),
    emptyOutDir: true,
  },
});
