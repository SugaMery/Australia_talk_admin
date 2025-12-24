import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/translate': {
        target: 'https://libretranslate.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/translate/, '/translate'),
        secure: false
      }
    }
  }
});
