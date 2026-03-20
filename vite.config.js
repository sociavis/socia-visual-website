import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: 'index.html',
        games: 'games.html',
        about: 'about-site.html',
        og: 'og-image-generator.html'
      }
    }
  },
  server: {
    open: true
  }
});
