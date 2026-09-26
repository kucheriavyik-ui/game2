// Smoke test for the story: every knot, journal id, variable and location that
// content refers to exists. Run with `npm run story:check`.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Story } from 'inkjs';

const compiled = readFileSync('content/story/main.ink.json', 'utf8');
let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL ${msg}`);
};

// --- 1. Every knot referenced from locations/characters exists -------------
const referenced = new Set();
const locDir = 'content/locations';
for (const file of readdirSync(locDir).filter((f) => f.endsWith('.json'))) {
  const loc = JSON.parse(readFileSync(path.join(locDir, file), 'utf8'));
  for (const e of loc.entities) if (e.ink) referenced.add(e.ink);
}
const charDir = 'content/characters';
for (const file of readdirSync(charDir)) {
  const c = JSON.parse(readFileSync(path.join(charDir, file), 'utf8'));
  if (c.ink) referenced.add(c.ink);
}

const probe = new Story(compiled);
console.log('Knots referenced by content:');
for (const knot of [...referenced].sort()) {
  if (probe.KnotContainerWithName(knot)) console.log(`  ok   ${knot}`);
  else fail(`knot "${knot}" is missing from the story`);
}

// --- 2. Journal ids used in tags exist in journal.json -------------------
const journal = JSON.parse(readFileSync('content/journal.json', 'utf8'));
const inkSources = [];
const walk = (dir) => {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.ink')) inkSources.push(readFileSync(p, 'utf8'));
  }
};
walk('content/story');
console.log('Journal tags:');
for (const src of inkSources) {
  for (const m of src.matchAll(/#\s*journal:add:([\w-]+)/g)) {
    if (journal[m[1]]) console.log(`  ok   ${m[1]}`);
    else fail(`journal entry "${m[1]}" is tagged in Ink but missing from journal.json`);
  }
}

// --- 2b. «Люди» conditions name real Ink variables ------------------------
const people = JSON.parse(readFileSync('content/people.json', 'utf8'));
const inkVars = new Set([...readFileSync('content/story/main.ink', 'utf8').matchAll(/^VAR\s+(\w+)/gm)].map((m) => m[1]));
console.log('People conditions:');
for (const id of people.order) {
  if (!people.people[id]) fail(`people.json: "${id}" is in order but has no lines`);
  for (const line of people.people[id] ?? []) {
    const name = line.when.replace(/^!/, '').trim();
    if (!inkVars.has(name)) fail(`people.json: ${id} uses "${line.when}", but main.ink has no VAR ${name}`);
  }
}
console.log(`  ok   ${people.order.length} people checked`);

// --- 2c. Chapters point at real locations and knots ------------------------
const chaptersList = JSON.parse(readFileSync('content/chapters.json', 'utf8'));
console.log('Chapters:');
for (const ch of chaptersList) {
  const loc = path.join('content/locations', `${ch.start.location}.json`);
  let ok = true;
  try {
    const def = JSON.parse(readFileSync(loc, 'utf8'));
    if (!def.spawns[ch.start.spawn]) {
      fail(`chapter ${ch.id}: location ${ch.start.location} has no spawn "${ch.start.spawn}"`);
      ok = false;
    }
  } catch {
    fail(`chapter ${ch.id}: no location file ${loc}`);
    ok = false;
  }
  for (const knot of [ch.intro, ch.setup]) {
    if (knot && !probe.KnotContainerWithName(knot)) {
      fail(`chapter ${ch.id}: knot "${knot}" is missing`);
      ok = false;
    }
  }
  if (ok) console.log(`  ok   ${ch.id} «${ch.title}»`);
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log('\nStory check passed.');
