// Turns the Vite build (dist/) into a folder the claude.ai Artifact tool can publish:
// artifact/index.html holds only page content (the Artifact wraps it in its own
// <html>/<head>), and artifact/assets/ holds every file the page loads.
// artifact/files.json lists those files for the publish call.
// Run with `npm run artifact` (it builds first).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DIST = 'dist/assets';
const OUT = 'artifact';
const LIMITS = { files: 255, fileBytes: 16 * 1024 * 1024, totalBytes: 64 * 1024 * 1024 };

if (!existsSync(DIST)) {
  console.error('No dist/ — run the build first (npm run artifact does it for you).');
  process.exit(1);
}
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
cpSync(DIST, path.join(OUT, 'assets'), { recursive: true });

const assets = readdirSync(path.join(OUT, 'assets'));
const script = assets.find((f) => /^index-.*\.js$/.test(f));
const font = assets.find((f) => /^PressStart2P.*\.ttf$/.test(f));
if (!script || !font) {
  console.error('Build output is missing the game script or the font.');
  process.exit(1);
}

writeFileSync(
  path.join(OUT, 'index.html'),
  `<title>Облога Корвена</title>
<style>
  @font-face {
    font-family: 'Press Start 2P';
    src: url('./assets/${font}') format('truetype');
    font-display: block;
  }
  html, body { margin: 0; width: 100%; height: 100%; background: #0b0a0a; color: #e8e0d0; overflow: hidden; }
  #game { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
</style>
<div id="game"></div>
<script type="module" src="./assets/${script}"></script>
`,
);

const files = assets.map((f) => `assets/${f}`);
writeFileSync(path.join(OUT, 'files.json'), JSON.stringify(files.map((p) => ({ path: p })), null, 1) + '\n');

let total = 0;
for (const f of files) {
  const size = statSync(path.join(OUT, f)).size;
  total += size;
  if (size > LIMITS.fileBytes) console.warn(`  over the per-file limit: ${f} (${(size / 1e6).toFixed(1)} MB)`);
}
console.log(`artifact/: ${files.length} files, ${(total / 1e6).toFixed(1)} MB`);
if (files.length > LIMITS.files) console.warn(`  more than ${LIMITS.files} files — the Artifact will refuse it`);
if (total > LIMITS.totalBytes) console.warn('  over 64 MB per version — the Artifact will refuse it');
