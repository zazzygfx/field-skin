import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': r('./src') } },
  build: {
    rollupOptions: {
      // index.html = showcase site; dev.html = the player alone with the Shift+D panel
      input: { site: r('./index.html'), dev: r('./dev.html') },
    },
  },
});
