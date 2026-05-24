import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Browser CORS: relatedwords.io does not send Access-Control-Allow-Origin,
      // so we proxy /api/words → https://relatedwords.io/api/relatedTerms.
      // Express server provides the same path in production.
      '/api/words': {
        target: 'https://relatedwords.io',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/words/, '/api/relatedTerms'),
      },
    },
  },
});
