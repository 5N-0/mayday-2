import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.hdr', '**/*.json'],
  build: {
    chunkSizeWarningLimit: 1600,
  }
});