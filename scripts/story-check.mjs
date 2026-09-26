// Smoke test for the story: every knot, journal entry, variable and location that
// content refers to exists, and the month loop can be played through.
// Run with `npm run story:check`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Story } from 'inkjs';

const compiled = readFileSync('content/story/main.ink.json', 'utf8');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL ${msg}`);
};
const ok = (msg) => console.log(`  ok   ${msg}`);

const probe = new Story(compiled);
const inkVars = new Set([...readFileSync('content/story/main.ink', 'utf8').matchAll(/^VAR\s+(\w+)/gm)].map((m) => m[1]));
const hasKnot = (name) => Boolean(probe.KnotContainerWithName(name));

const inkSources = [];
const walk = (dir) => {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.ink')) inkSources.push({ file: p, text: readFileSync(p, 'utf8') });
  }
};
walk('content/story');

// --- 1. Months: location, spawn, council table, knots ---------------------
const months = readdirSync('content/months')
  .filter((f) => f.endsWith('.json'))
  .map((f) => readJson(path.join('content/months', f)))
  .sort((a, b) => a.number - b.number);
console.log('Months:');
for (const m of months) {
  const locFile = path.join('content/locations', `${m.location}.json`);
  if (!existsSync(locFile)) {
    fail(`${m.id}: no location file ${locFile}`);
    continue;
  }
  const loc = readJson(locFile);
  if (!loc.spawns.start) fail(`${m.id}: location ${m.location} has no spawn "start"`);
  if (!loc.entities.some((e) => e.type === 'council_table' && (!e.month || e.month === m.id))) {
    fail(`${m.id}: location ${m.location} has no council_table`);
  }
  for (const key of ['ink_open', 'ink_council', 'ink_end']) {
    if (!m[key] || !hasKnot(m[key])) fail(`${m.id}: ${key} "${m[key]}" is not a knot`);
  }
  ok(`${m.id} «${m.title}» at ${m.location}`);
}

// --- 2. Knots named by locations and the engine ---------------------------
console.log('Knots:');
const referenced = new Set(['prologue', 'defeat_check']);
for (const id of ['famine', 'bankrupt', 'fall', 'coup']) referenced.add(`game_over_${id}`);
for (const file of readdirSync('content/locations').filter((f) => f.endsWith('.json'))) {
  for (const e of readJson(path.join('content/locations', file)).entities) if (e.ink) referenced.add(e.ink);
}
for (const knot of [...referenced].sort()) {
  if (hasKnot(knot)) ok(knot);
  else fail(`knot "${knot}" is missing from the story`);
}

// --- 3. Journal, resources, council ----------------------------------------
console.log('Journal:');
const journal = readJson('content/journal.json');
for (const { file, text } of inkSources) {
  for (const m of text.matchAll(/#\s*journal:([\w-]+)/g)) {
    if (!journal[m[1]]) fail(`${file}: journal entry "${m[1]}" is missing from journal.json`);
  }
}
for (const name of inkVars) {
  if (name.startsWith('k_') && !journal[name]) fail(`Knowledge VAR ${name} has no journal entry`);
}
ok(`${Object.keys(journal).filter((k) => !k.startsWith('_')).length} entries`);

console.log('Resources:');
for (const r of readJson('content/resources.json')) {
  if (inkVars.has(r.var)) ok(r.var);
  else fail(`resources.json: "${r.var}" has no VAR in main.ink`);
}

console.log('Council:');
const council = readJson('content/council.json');
for (const id of council.advisors) {
  if (!existsSync(path.join('content/characters', `${id}.json`))) fail(`council: ${id} has no character file`);
  if (!inkVars.has(`loy_${id}`)) fail(`council: ${id} has no VAR loy_${id}`);
}
for (const { file, text } of inkSources) {
  for (const m of text.matchAll(/#stance:(\w+):(\w+)/g)) {
    if (!council.advisors.includes(m[1])) fail(`${file}: stance for "${m[1]}", who is not on the council`);
    if (!['for', 'against', 'neutral'].includes(m[2])) fail(`${file}: stance "${m[2]}" is not for/against/neutral`);
  }
}
ok(`${council.advisors.length} advisors`);

// --- 4. Playing the loop ---------------------------------------------------
/** Runs a knot, picking choices by matching the start of their text; returns every tag seen. */
function play(story, knot, picks = [], { stopAtChoice = false } = {}) {
  const tags = [];
  story.ChoosePathString(knot);
  for (let guard = 0; guard < 200; guard++) {
    while (story.canContinue) {
      story.Continue();
      tags.push(...story.currentTags);
    }
    if (story.currentChoices.length === 0 || (stopAtChoice && picks.length === 0)) break;
    const want = picks.shift();
    const idx = want === undefined ? -1 : story.currentChoices.findIndex((c) => c.text.startsWith(want));
    if (idx === -1) {
      fail(`in "${knot}": no choice starting with "${want}". Offered: ${story.currentChoices.map((c) => `"${c.text}"`).join(', ')}`);
      return tags;
    }
    story.ChooseChoiceIndex(idx);
  }
  return tags;
}
/** What the engine does with `# journal:<id>`: Knowledge VARs become true. */
function learn(story, tags) {
  for (const t of tags) {
    const id = t.startsWith('journal:') ? t.slice(8) : null;
    if (id && inkVars.has(id)) story.variablesState.$(id, true);
  }
}
/** The choices a knot offers after its opening lines. */
function offered(story, knot, picks = []) {
  play(story, knot, picks, { stopAtChoice: true });
  return story.currentChoices.map((c) => c.text);
}

console.log('Playthrough:');
{
  const s = new Story(compiled);
  if (play(s, 'prologue').includes(`goto:${months[0]?.id}`)) ok('prologue leads to the first month');
  else fail('prologue has no # goto to the first month');

  // Hidden option: not offered without Knowledge, offered after learning it.
  const before = offered(s, 'm01_council', ['Так']);
  if (before.some((t) => t.startsWith('Впустити лише ремісників'))) fail('smiths option offered without k_smiths');
  else ok('hidden option stays hidden without Knowledge');
  const s2 = new Story(compiled);
  learn(s2, play(s2, 'tobias_talk'));
  if (offered(s2, 'm01_council', ['Так']).some((t) => t.startsWith('Впустити лише ремісників'))) ok('Knowledge opens the hidden option');
  else fail('smiths option not offered after tobias_talk');

  // A full month: open, council, end — month_end must be tagged, the city must survive.
  const s3 = new Story(compiled);
  play(s3, 'm01_open');
  const councilTags = play(s3, 'm01_council', ['Так', 'Закрити ворота', 'Спалити']);
  if (councilTags.includes('month_end')) ok('m01 council ends the month');
  else fail('m01 council has no # month_end');
  const endTags = play(s3, 'm01_end');
  if (endTags.some((t) => t.startsWith('game_over'))) fail('m01 with ordinary choices ends in defeat');
  else ok(`m01 survived: bread ${s3.variablesState.$('bread')}, order ${s3.variablesState.$('order')}`);

  // Defeat: emptying the granaries in month 2 must end the game.
  const lost = play(s3, 'm02_council', ['Так', 'Відкрити комори']).concat(play(s3, 'm02_end'));
  if (lost.includes('game_over:famine')) ok('empty granaries -> game_over:famine');
  else fail(`no famine after emptying the granaries (bread ${s3.variablesState.$('bread')})`);
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log('\nStory check passed.');
