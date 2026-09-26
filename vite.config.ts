import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built site works from any folder or subpath.
  base: './',
  server: {
    port: 5174,
    open: false,
    // Files downloaded into assets/ are written in chunks; without this the
    // watcher tries to open them mid-write and crashes the dev server (EBUSY).
    watch: { awaitWriteFinish: { stabilityThreshold: 800, pollInterval: 100 } },
  },
});
