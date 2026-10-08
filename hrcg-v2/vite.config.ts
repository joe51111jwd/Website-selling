import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5400 },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        story: fileURLToPath(new URL('./story.html', import.meta.url)),
      },
    },
  },
});
