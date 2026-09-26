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
  build: {
    // Small files are normally inlined as base64 data URLs. Phaser decodes those
    // as Latin-1, which turns Cyrillic in JSON (names, labels) into mojibake, so
    // text content always ships as real files. Small images may still be inlined.
    assetsInlineLimit: (file) => (/\.(json|txt)$/.test(file) ? false : undefined),
  },
});
