// Compiles content/story/main.ink (with its INCLUDEs) into main.ink.json.
// Run with `npm run ink`; `npm run dev` and `npm run build` call it automatically.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Compiler } from 'inkjs/compiler/Compiler';
import { CompilerOptions } from 'inkjs/compiler/CompilerOptions';
import { PosixFileHandler } from 'inkjs/compiler/FileHandler/PosixFileHandler';
import { ErrorType } from 'inkjs/engine/Error';

const STORY_DIR = path.resolve('content/story');
const ENTRY = 'main.ink';
const OUTPUT = path.join(STORY_DIR, 'main.ink.json');

let failed = false;
const onError = (message, type) => {
  const label = type === ErrorType.Warning ? 'warning' : 'error';
  console.error(`[ink ${label}] ${message}`);
  if (type !== ErrorType.Warning) failed = true;
};

const source = readFileSync(path.join(STORY_DIR, ENTRY), 'utf8');
const options = new CompilerOptions(ENTRY, [], false, onError, new PosixFileHandler(STORY_DIR + path.sep));
const story = new Compiler(source, options).Compile();

if (failed || !story) {
  console.error('Ink compilation failed.');
  process.exit(1);
}

writeFileSync(OUTPUT, story.ToJson(), 'utf8');
console.log(`Ink compiled -> ${path.relative(process.cwd(), OUTPUT)}`);
