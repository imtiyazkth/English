#!/usr/bin/env node
// Fails if anything that looks like a real API key is found in the project (or, with --dist, in the build).
// Run by `npm run lint` and `npm run check`. It prints file names only, never the matched text.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const distOnly = process.argv.includes('--dist');
const SKIP = new Set(['node_modules', '.git', 'dist', '.wrangler', 'coverage', 'package-lock.json']);
const TEXT_EXT = /\.(ts|tsx|js|mjs|cjs|json|md|html|css|toml|txt|svg|webmanifest|example|vars|yml|yaml)$/i;
// Google API keys start with "AIza" followed by 35 URL-safe characters; also catch generic long secrets assigned to *KEY/*SECRET/*TOKEN.
const PATTERNS = [
  /AIza[0-9A-Za-z_-]{35}/,
  /(?:API_KEY|SECRET|TOKEN)\s*[=:]\s*["']?(?!your-key|placeholder|x{3,}|<)[A-Za-z0-9_\-]{32,}["']?/,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
];

function* walk(dir, skipDist) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) && !(distOnly && name === 'dist')) continue;
    if (skipDist && name === 'dist') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p, skipDist);
    else if (st.size < 5_000_000 && (TEXT_EXT.test(name) || name === '.gitignore' || name.startsWith('.dev.vars'))) yield p;
  }
}

const target = distOnly ? join(root, 'dist') : root;
if (distOnly && !existsSync(target)) {
  console.error('check-secrets: dist/ not found. Run `npm run build` first.');
  process.exit(1);
}
const hits = [];
for (const file of walk(target, !distOnly)) {
  const text = readFileSync(file, 'utf8');
  if (PATTERNS.some((re) => re.test(text))) hits.push(relative(root, file));
}
// A real .dev.vars / .env must never be inside the project tree that gets zipped or committed.
const forbidden = ['.dev.vars', '.env'].filter((f) => existsSync(join(root, f)));

if (hits.length || (!distOnly && forbidden.length)) {
  if (hits.length) console.error(`check-secrets: possible secret(s) found in:\n  ${hits.join('\n  ')}`);
  if (!distOnly && forbidden.length) console.error(`check-secrets: local secret file(s) present (git-ignored, but do NOT zip or share): ${forbidden.join(', ')}`);
  process.exit(hits.length ? 1 : 0);
}
console.log(`check-secrets: OK (${distOnly ? 'build output' : 'source tree'} contains no key-like strings).`);
