// Lists the recordings the app expects but cannot find, grouped by folder.
//   npm run audio:check
import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync('src/lib/content.ts', 'utf8');
const root = 'public/audio';
const EXT = /\.(mp3|wav|m4a|aac|ogg|oga|opus|webm)$/i;

const have = new Set();
if (fs.existsSync(root)) {
  for (const d of fs.readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of fs.readdirSync(path.join(root, d.name))) if (EXT.test(f)) have.add(`${d.name}/${f.replace(EXT, '').toLowerCase()}`);
  }
}

const ids = (re) => [...src.matchAll(re)].map((m) => m[1]);
const need = {
  words: ids(/^\s*c\('([^']+)'/gm),
  sounds: [...new Set(ids(/\{ id: '([^']+)', emoji: '[^']+', name: '[^']+', say:/g))],
  phonemes: [],
  phrases: [...ids(/id: '([a-z-]+)', syllables/g), ...ids(/\{ id: '([a-z-]+)', words:/g)],
  aac: ids(/\{ id: '([^']+)', word: '[^']+', emoji: '[^']+', color/g),
  prompts: ['where-is', 'what-is-it', 'want-this', 'praise-1', 'praise-2', 'praise-3'],
};
// echo levels
const echo = src.match(/ECHO_LEVELS[^=]*=\s*\{([\s\S]*?)\n\};/);
if (echo) need.phonemes = [...new Set([...echo[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]).filter((k) => !['vowels', 'lips', 'tongue', 'ou', 'doubles', 'mix'].includes(k)))];

let missingTotal = 0;
for (const [folder, list] of Object.entries(need)) {
  const missing = [...new Set(list)].filter((k) => !have.has(`${folder}/${k}`));
  missingTotal += missing.length;
  console.log(`\n${folder}/  –  ${[...new Set(list)].length - missing.length} of ${[...new Set(list)].length} recorded`);
  if (missing.length) console.log('  missing: ' + missing.join(', '));
}
console.log(`\n${missingTotal} recordings still missing. The app works without them (silent) – record and drop files in public/audio/<folder>/.`);
