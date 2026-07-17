import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, 'apps/web'),
  publicDir: path.resolve(__dirname, 'apps/web/public'),
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:4177',
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/v0.2.0'),
    emptyOutDir: true,
  },
});
