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
  for (const e of readJson(path.join('content/locations', file)).entities) {
    if (!e.ink) continue;
    // {month}_x: each month's own knot if the story has one, else <id>_idle, which must exist.
    if (e.ink.includes('{month}')) referenced.add(`${e.id}_idle`);
    else referenced.add(e.ink);
  }
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
const seatId = (seat) => (typeof seat === 'string' ? seat : seat.id);
const advisorIds = council.advisors.map(seatId);
for (const seat of council.advisors) {
  if (typeof seat !== 'string' && seat.when && !inkVars.has(seat.when.replace(/^!/, ''))) fail(`council: seat ${seat.id} waits on unknown VAR ${seat.when}`);
}
for (const id of advisorIds) {
  if (!existsSync(path.join('content/characters', `${id}.json`))) fail(`council: ${id} has no character file`);
  if (!inkVars.has(`loy_${id}`)) fail(`council: ${id} has no VAR loy_${id}`);
}
for (const { file, text } of inkSources) {
  for (const m of text.matchAll(/#stance:(\w+):(\w+)/g)) {
    if (!advisorIds.includes(m[1])) fail(`${file}: stance for "${m[1]}", who is not on the council`);
    if (!['for', 'against', 'neutral'].includes(m[2])) fail(`${file}: stance "${m[2]}" is not for/against/neutral`);
  }
}
ok(`${advisorIds.length} advisors`);

// Every Knowledge VAR belongs to exactly one month's `knowledge` list (a game
// started later treats earlier months' Knowledge as learned).
console.log('Knowledge per month:');
{
  const owner = new Map();
  for (const m of months) {
    for (const k of m.knowledge ?? []) {
      if (!inkVars.has(k)) fail(`${m.id}: knowledge "${k}" is not a VAR`);
      if (owner.has(k)) fail(`${k} is listed in both ${owner.get(k)} and ${m.id}`);
      owner.set(k, m.id);
    }
  }
  for (const name of inkVars) if (name.startsWith('k_') && !owner.has(name)) fail(`${name} is in no month's knowledge list`);
  ok(`${owner.size} Knowledge VARs assigned`);
}

console.log('Characters:');
{
  const chars = new Set(readdirSync('content/characters').map((f) => f.replace(/\.json$/, '')));
  for (const { file, text } of inkSources) {
    for (const m of text.matchAll(/#\s*speaker:(\w+)/g)) if (!chars.has(m[1])) fail(`${file}: speaker "${m[1]}" has no character file`);
  }
  for (const file of readdirSync('content/locations').filter((f) => f.endsWith('.json'))) {
    for (const e of readJson(path.join('content/locations', file)).entities) {
      if (e.type === 'npc' && !chars.has(e.id)) fail(`${file}: npc "${e.id}" has no character file`);
    }
  }
  ok(`${chars.size} characters`);
}

// --- 3b. Everyone can be walked up to -----------------------------------------
// A rough check on the tile grid: walkable = a non-solid legend tile that no
// solid entity stands on. From the "start" spawn every interactable must have a
// reachable tile next to (or under) it. Entity sizes are ignored, so it can
// miss a gap that big art closes — but it catches a person walled in by props.
console.log('Reachability:');
for (const file of readdirSync('content/locations').filter((f) => f.endsWith('.json'))) {
  const loc = readJson(path.join('content/locations', file));
  const rows = readFileSync(path.join('content/locations', loc.map), 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
  const blocked = new Set(
    loc.entities
      .filter((e) => e.type !== 'door' && !e.wall && !e.floor && e.solid !== false)
      .map((e) => `${Math.round(e.x)},${Math.round(e.y)}`),
  );
  const walkable = (x, y) => {
    const ch = rows[y]?.[x];
    return ch !== undefined && loc.legend[ch]?.solid === false && !blocked.has(`${x},${y}`);
  };
  const seen = new Set();
  const from = loc.spawns.start ?? Object.values(loc.spawns)[0];
  const queue = [[Math.round(from.x), Math.round(from.y)]];
  while (queue.length) {
    const [x, y] = queue.pop();
    const key = `${x},${y}`;
    if (seen.has(key) || !walkable(x, y)) continue;
    seen.add(key);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const unreachable = loc.entities
    .filter((e) => e.ink || e.type === 'council_table')
    .filter((e) => {
      const cx = Math.round(e.x);
      const cy = Math.round(e.y);
      return ![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dy]) => seen.has(`${cx + dx},${cy + dy}`));
    });
  if (unreachable.length) fail(`${loc.id}: cannot walk up to ${unreachable.map((e) => e.id).join(', ')}`);
  else ok(`${loc.id}: everyone reachable from "start"`);
}

// --- 4. Playing the loop ---------------------------------------------------
const MAX_CHOICES = 6; // keys 1-6

/**
 * Runs a knot like the engine does: picks choices by the start of their text,
 * applies `# journal:<id>` to Knowledge VARs, returns every tag seen.
 * With no picks left it leaves through «Піти» (or stops, with stopAtChoice).
 */
function play(story, knot, picks = [], { stopAtChoice = false, firstIfNoPick = false } = {}) {
  const tags = [];
  story.ChoosePathString(knot);
  for (let guard = 0; guard < 200; guard++) {
    while (story.canContinue) {
      story.Continue();
      tags.push(...story.currentTags);
      learn(story, story.currentTags);
    }
    const choices = story.currentChoices;
    if (choices.length === 0) break;
    if (choices.length > MAX_CHOICES) fail(`in "${knot}": ${choices.length} choices offered, keys go up to ${MAX_CHOICES}`);
    if (stopAtChoice && picks.length === 0) break;
    const want = picks.shift();
    let idx = want === undefined ? choices.findIndex((c) => c.text.startsWith('Піти')) : choices.findIndex((c) => c.text.startsWith(want));
    // A betrayal scene can appear in any opening: without a scripted answer, take the first one.
    if (idx === -1 && want === undefined && firstIfNoPick) idx = 0;
    if (idx === -1) {
      fail(`in "${knot}": no choice starting with "${want ?? 'Піти'}". Offered: ${choices.map((c) => `"${c.text}"`).join(', ')}`);
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
/** The choices a knot offers after the given picks. */
function offered(story, knot, picks = []) {
  play(story, knot, picks, { stopAtChoice: true });
  return story.currentChoices.map((c) => c.text);
}
const has = (list, start) => list.some((t) => t.startsWith(start));
const v = (s, name) => s.variablesState.$(name);

console.log('Every conversation can be finished:');
{
  let count = 0;
  for (const file of readdirSync('content/locations').filter((f) => f.endsWith('.json'))) {
    for (const e of readJson(path.join('content/locations', file)).entities) {
      if (!e.ink) continue;
      const knots = e.ink.includes('{month}')
        ? months.map((m) => e.ink.replace('{month}', m.id)).map((k) => (hasKnot(k) ? k : `${e.id}_idle`))
        : [e.ink];
      for (const knot of new Set(knots)) {
        const s = new Story(compiled);
        play(s, knot); // first visit
        play(s, knot); // and a second one
        count++;
      }
    }
  }
  ok(`${count} knots played twice`);
}

console.log('Knowledge opens options:');
{
  const s = new Story(compiled);
  if (has(offered(s, 'm01_council', ['Так']), 'Впустити лише ремісників')) fail('smiths option offered without k_smiths');
  play(s, 'm01_myroslava');
  if (has(offered(s, 'm01_council', ['Так']), 'Впустити лише ремісників')) ok('Myroslava -> smiths option');
  else fail('smiths option not offered after talking to Myroslava');
}
{
  // Lukash (m01) -> Anselm marks him -> in m03 he talks -> the double-agent option.
  const s = new Story(compiled);
  if (has(offered(s, 'm01_wicket'), 'Розповісти')) fail('Lukash can be reported before meeting him');
  play(s, 'm01_lukash');
  play(s, 'm01_wicket', ['Розповісти']);
  if (!v(s, 'f_spy_marked')) fail('reporting Lukash does not set f_spy_marked');
  play(s, 'm03_spy');
  if (has(offered(s, 'm03_council', ['Так', 'Закрити квартал']), 'Перевербувати')) ok('Lukash chain -> double-agent option');
  else fail('double-agent option missing after the Lukash chain');
  const fresh = new Story(compiled);
  play(fresh, 'm03_spy');
  if (has(offered(fresh, 'm03_council', ['Так', 'Закрити квартал']), 'Перевербувати')) fail('double agent offered without f_spy_marked');
}
{
  // Gnat -> Horn -> the fireships; the Knights' sortie is always there.
  const s = new Story(compiled);
  const plain = offered(s, 'm03_council', ['Так', 'Закрити квартал', 'Публічний суд']);
  if (has(plain, 'Брандери')) fail('fireships offered without k_fireships_plan');
  if (!has(plain, 'Вилазка Лицарів')) fail('the Knights sortie is missing');
  const t = new Story(compiled);
  play(t, 'm03_gnat');
  play(t, 'm03_horn', ['Розповісти']);
  if (has(offered(t, 'm03_council', ['Так', 'Закрити квартал', 'Публічний суд']), 'Брандери')) ok('Gnat + Horn -> fireships');
  else fail('fireships missing after Gnat and Horn');
}
{
  // The conspiracy: Isolde leaves the council unless turned; Erik takes the seat.
  const s = new Story(compiled);
  const tags = play(s, 'm03_council', ['Так', 'Закрити квартал', 'Публічний суд', 'Не ризикувати', 'Публічна страта']);
  if (!tags.includes('month_end')) fail('m03 council does not end the month');
  if (!v(s, 'out_isolde') || v(s, 'loy_erik') !== 6) fail('after the execution Isolde is still in, or Erik not appointed');
  else ok('execution: Isolde out, Erik appointed with loyalty 6');
  const turned = new Story(compiled);
  if (has(offered(turned, 'm03_council', ['Так', 'Закрити квартал', 'Публічний суд', 'Не ризикувати']), 'Лишити на волі')) fail('turning Isolde offered without names or a double agent');
  const u = new Story(compiled);
  play(u, 'm03_council', ['Так', 'Закрити квартал', 'Допит Інквізиції', 'Не ризикувати', 'Лишити на волі']);
  if (v(u, 'out_isolde') || !v(u, 'f_traitor_turned')) fail('a turned Isolde left the council');
  else ok('turned Isolde stays, broken');
  // Three pieces of evidence -> the full confession.
  const w = new Story(compiled);
  play(w, 'm02_erik');
  play(w, 'm03_obj_purse');
  play(w, 'm03_gnat');
  play(w, 'm03_isolde', ['Розповісти']);
  const before = w.variablesState.$('k_hidden_warehouses') && w.variablesState.$('k_guild_silver') && w.variablesState.$('k_isolde_offer');
  if (!before) fail('evidence Knowledge did not stick');
  else ok('three pieces of evidence can be gathered');
}
{
  // Month 4: the hero decision follows month 3, the envoy has its hidden options.
  const s = new Story(compiled);
  play(s, 'm03_council', ['Так', 'Закрити квартал', 'Допит Інквізиції', 'Вилазка Лицарів', 'Лишити на волі']);
  play(s, 'm03_end');
  play(s, 'm04_open', [], { firstIfNoPick: true });
  // Choices marked * are once-only, so every look at the council starts from the same saved state.
  const saved = s.state.ToJson();
  const hero = offered(s, 'm04_council', ['Так', 'Служба в Храмі', 'Не озброювати']);
  if (!has(hero, 'Лицарі Тіла')) fail(`after the Knights sortie the hero options are: ${hero.join(' / ')}`);
  s.state.LoadJson(saved);
  const envoy = offered(s, 'm04_council', ['Так', 'Служба в Храмі', 'Не озброювати', 'Лицарі Тіла']);
  s.state.LoadJson(saved);
  if (has(envoy, 'Показати послу')) ok('turned Isolde -> misleading the envoy');
  else fail('misleading the envoy missing with a turned Isolde');
  if (has(envoy, 'Відпустити посла з подарунком')) fail('the medicine option offered without k_horde_fever');
  play(s, 'm04_erden');
  play(s, 'm04_obj_sacks');
  if (has(offered(s, 'm04_council', ['Так', 'Служба в Храмі', 'Не озброювати', 'Лицарі Тіла']), 'Відпустити посла з подарунком')) ok('Erden + sacks -> the medicine option');
  else fail('the medicine option missing after the sacks');
}
{
  // Starting from a later month: the councils of earlier months replay with all their Knowledge.
  const s = new Story(compiled);
  for (const m of months.slice(0, 3)) for (const k of m.knowledge ?? []) s.variablesState.$(k, true);
  for (const m of months.slice(0, 3)) {
    const tags = play(s, m.ink_council, ['Так'], { firstIfNoPick: true });
    if (!tags.includes('month_end')) fail(`setup replay of ${m.id} does not reach month_end`);
    play(s, m.ink_end);
  }
  play(s, 'm04_open', [], { firstIfNoPick: true });
  ok(`replaying months 1-3 with first picks: bread ${v(s, 'bread')}, gold ${v(s, 'gold')}, walls ${v(s, 'walls')}, order ${v(s, 'order')}`);
}
{
  // Military: Myron and Sira Ruka's Knowledge opens or improves the army decisions.
  const s = new Story(compiled);
  if (has(offered(s, 'm01_council', ['Так', 'Закрити ворота', 'Спалити']), 'Перекинути камінь')) fail('north tower option without k_north_tower');
  const t = new Story(compiled);
  play(t, 'm01_myron', ['«Як вам стіна?»']);
  if (has(offered(t, 'm01_council', ['Так', 'Закрити ворота', 'Спалити']), 'Перекинути камінь')) ok('Myron -> north tower option');
  else fail('north tower option missing after Myron');
  const u = new Story(compiled);
  play(u, 'm02_myron', ['«Скільки гарнізону винні?»']);
  if (has(offered(u, 'm02_council', ['Так', 'Пайки через міську варту', 'Не чіпати']), 'Виплатити гарнізону')) ok('Myron -> pay the garrison option');
  else fail('pay-arrears option missing after Myron');
  const blind = new Story(compiled);
  play(blind, 'm01_council', ['Так', 'Закрити ворота', 'Спалити', 'Нічна вилазка']);
  const scouted = new Story(compiled);
  play(scouted, 'm01_sira_ruka', ['«Що бачать ваші розвідники?»']);
  play(scouted, 'm01_council', ['Так', 'Закрити ворота', 'Спалити', 'Нічна вилазка']);
  if (v(scouted, 'walls') > v(blind, 'walls') && v(scouted, 'f_sally_ford')) ok('scouting the ford makes the sally cheaper');
  else fail('the ford Knowledge does not change the sally');
}

console.log('Six months:');
{
  const s = new Story(compiled);
  if (play(s, 'prologue').includes(`goto:${months[0]?.id}`)) ok('prologue leads to the first month');
  else fail('prologue has no # goto to the first month');
  const runs = [
    ['m01', ['Так', 'Закрити ворота', 'Спалити', 'Усі сили']],
    ['m02', ['Так', 'Пайки через міську варту', 'Конфіскувати три склади', 'Половину варти']],
    ['m03', ['Так', 'Закрити квартал', 'Публічний суд', 'Не ризикувати', 'Суд Інквізиції']],
    ['m04', ['Так', 'Служба в Храмі', 'Лише під присягою', 'Божена', 'Прогнати з честю']],
    ['m05', ['Так', 'Зачиняти хворих', 'Дати йому амвон']],
    ['m06', ['Так', 'Штарн лишається']],
  ];
  for (const [id, picks] of runs) {
    play(s, `${id}_open`, [], { firstIfNoPick: true });
    if (!play(s, `${id}_council`, picks).includes('month_end')) fail(`${id}: council has no # month_end`);
    const end = play(s, `${id}_end`);
    if (end.some((t) => t.startsWith('game_over'))) fail(`${id}: ordinary choices end in defeat`);
    else ok(`${id}: bread ${v(s, 'bread')}, gold ${v(s, 'gold')}, walls ${v(s, 'walls')}, order ${v(s, 'order')}`);
  }
}
{
  const s = new Story(compiled);
  s.variablesState.$('bread', 5);
  if (play(s, 'm01_end').includes('game_over:famine')) ok('bread 5 at the end of a month -> famine');
  else fail('no famine with 5 bread at the month end');
}

console.log('Betrayals:');
{
  // Nobody low: no scene.
  const s = new Story(compiled);
  play(s, 'm04_open', [], { stopAtChoice: true });
  if (s.currentChoices.length > 0) fail('a betrayal plays with everyone at loyalty 5');
  else ok('no betrayal while everyone is loyal');
}
{
  // The lowest betrays, only one per month, never twice.
  const s = new Story(compiled);
  s.variablesState.$('loy_tobias', 2);
  s.variablesState.$('loy_horn', 1);
  play(s, 'm04_open', ['Розжалувати']);
  if (!v(s, 'b_horn') || v(s, 'b_tobias')) fail('more than one betrayal in a month, or the wrong one');
  else ok('lowest loyalty betrays first, one per month');
  play(s, 'm05_open', ['Вигнати']);
  if (!v(s, 'out_tobias')) fail('expelling Tobias does not take him out of the council');
  play(s, 'm06_open', [], { stopAtChoice: true });
  if (s.currentChoices.length > 0) fail('someone betrays twice');
  else ok('next months: Tobias, then nobody twice');
}

console.log('Month 6 variants:');
{
  // A: unwatched night runs -> the marshal is poisoned.
  const s = new Story(compiled);
  s.variablesState.$('f_night_runs', true);
  play(s, 'm05_end');
  if (!v(s, 'f_marshal_poisoned')) fail('unwatched night runs do not lead to the poisoning');
  play(s, 'm06_open');
  if (!v(s, 'f_shtarn_dead') || !v(s, 'out_shtarn')) fail('the marshal did not die in variant A');
  play(s, 'm06_nomi');
  const verdict = offered(s, 'm06_council', ['Так']);
  if (has(verdict, 'Правда: Ізольда')) ok('A: poisoning, the ribbon opens the truth about Isolde');
  else fail(`A: no truth option after the ribbon: ${verdict.join(' / ')}`);
}
{
  // B with watched runs: the marshal lives, Isolde's smuggling comes up at the council.
  const s = new Story(compiled);
  s.variablesState.$('f_night_runs', true);
  s.variablesState.$('f_night_runs_watched', true);
  play(s, 'm05_end');
  play(s, 'm06_open');
  if (v(s, 'f_shtarn_dead')) fail('watched runs still kill the marshal');
  const runs = offered(s, 'm06_council', ['Так', 'Штарн лишається']);
  if (has(runs, 'Публічний суд')) ok('B + watched: marshal lives, Isolde judged at the council');
  else fail(`B + watched: no decision about Isolde's ships: ${runs.join(' / ')}`);
}
{
  // Ferrante's letters appear only after the folder is opened.
  const s = new Story(compiled);
  play(s, 'm06_open');
  const tags = play(s, 'm06_council', ['Так', 'Штарн лишається']);
  if (!tags.includes('month_end')) fail('B without letters does not end the month');
  const t = new Story(compiled);
  play(t, 'm06_open');
  play(t, 'm06_ferrante', ['«Покажіть теку»']);
  if (has(offered(t, 'm06_council', ['Так', 'Штарн лишається']), 'Лишити канал')) ok('the letters decision needs the folder');
  else fail('no letters decision after opening the folder');
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log('\nStory check passed.');
