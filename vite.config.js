import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    },
    proxy: {
      '/process-video': 'http://localhost:3000'
    }
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
        }
      }
    }
  }
});