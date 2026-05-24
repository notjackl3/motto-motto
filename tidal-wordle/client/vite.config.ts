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
      // Open-Meteo current weather. Dev proxy avoids any CORS surprises;
      // the Express server provides the same path for prod.
      '/api/weather': {
        target: 'https://api.open-meteo.com',
        changeOrigin: true,
        rewrite: (p) => {
          const q = p.replace(/^\/api\/weather/, '');
          // Pass through lat/lon and request the full current set we need.
          const params = new URLSearchParams(q.replace(/^\?/, ''));
          params.set(
            'current',
            'temperature_2m,is_day,weather_code,cloud_cover,precipitation'
          );
          // Open-Meteo expects `latitude` / `longitude`, not `lat` / `lon`.
          const lat = params.get('lat');
          const lon = params.get('lon');
          if (lat) params.set('latitude', lat);
          if (lon) params.set('longitude', lon);
          params.delete('lat');
          params.delete('lon');
          return `/v1/forecast?${params.toString()}`;
        },
      },
    },
  },
});
