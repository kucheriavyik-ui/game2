// Downloads files into assets/ without tripping the Vite watcher: each file is
// written to the OS temp folder first and then moved into place in one step,
// so the watcher never sees a half-written file (which crashes it with EBUSY).
//
//   node scripts/fetch-asset.mjs <url> <path-under-assets> [<url> <path> ...]
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  console.error('usage: node scripts/fetch-asset.mjs <url> <path-under-assets> [...]');
  process.exit(1);
}

for (let i = 0; i < args.length; i += 2) {
  const [url, rel] = [args[i], args[i + 1]];
  const dest = path.resolve('assets', rel);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAIL ${rel}: ${res.status} ${res.statusText} (${url})`);
    process.exitCode = 1;
    continue;
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const tmp = path.join(tmpdir(), `korven-${process.pid}-${i}.bin`);
  writeFileSync(tmp, bytes);
  mkdirSync(path.dirname(dest), { recursive: true });
  renameSync(tmp, dest);
  console.log(`ok   ${rel} (${bytes.length} bytes)`);
}
