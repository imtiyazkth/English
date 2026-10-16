# English Saathi (इंग्लिश साथी)

A mobile-first, installable web app (PWA) that helps Hindi speakers learn English from **Zero English** up to **C1**, with Hindi explanations first and all four skills (reading, writing, listening, speaking) plus grammar, vocabulary and pronunciation.

> **Honest status:** this is a working, well-structured starter with a complete app shell, learning engine and a *seeded* curriculum (14 lessons, ~200 exercises, 62 words, 28 grammar topics). It is **not** a finished 6-level course — see [docs/CURRICULUM.md](docs/CURRICULUM.md) for how to add lessons, and [docs/QA_REPORT.md](docs/QA_REPORT.md) for exactly what was and was not tested.

## Features
- Onboarding with **Start from zero** and an optional placement check; Hindi / mixed / English-only support.
- Lessons (Hindi explanation, examples, practice) with prerequisites and mastery tracking.
- 9 exercise types: multiple choice, fill-in-the-blank, translate (word bank), sentence arrange, match pairs, dictation, correct-the-mistake, speaking, writing.
- Daily path, daily check, timed quiz, weekly test, unit tests, per-skill practice, "replay missed".
- Spaced-repetition flashcards (SM-2 style) and your own saved words.
- Reading, listening, speaking (role-play prompts), pronunciation drills, writing tasks with rule-based checks, grammar library.
- **Saathi AI Tutor** (Gemini) through a server-side function — the API key never reaches the browser.
- Dashboard with **real data only** (no invented stats), streaks, weekly activity, achievements.
- Offline-capable PWA, local storage (IndexedDB with fallbacks), JSON export / import, dark mode, large text, reduced motion.
- Speech uses the browser's Web Speech API when available; typed fallbacks otherwise. Recognition compares words — it is **not** a pronunciation score.

## Quick start
```bash
npm install          # creates package-lock.json on first run
npm run dev          # http://localhost:5173
npm run check        # typecheck + secret scan
npm test             # vitest
npm run build        # outputs dist/
```
The tutor needs the backend function. To try it locally:
```bash
cp .dev.vars.example .dev.vars   # then put your own key in .dev.vars (git-ignored)
npm run build
npx wrangler pages dev dist
```
Everything else works without any key.

## Project layout
```
src/app          shell, router (hash-based), store
src/components   exercise player, UI kit
src/features     one folder per screen
src/data         curriculum, vocab, grammar, reading, listening…
src/services     progress, selectors, quiz builder, storage, speech, tutor client
functions/api    Cloudflare Pages Functions (health, tutor)
tests            unit tests
docs             deployment, Termux/GitHub, curriculum, privacy, QA
```

## Docs
- [Deployment (Cloudflare Pages)](docs/DEPLOYMENT.md)
- [Termux → GitHub push](docs/TERMUX_GITHUB_PUSH.md)
- [Curriculum & adding content](docs/CURRICULUM.md)
- [Privacy](docs/PRIVACY.md)
- [QA report](docs/QA_REPORT.md)

## Security
No API key is in the source, the ZIP or the browser bundle. `npm run lint` runs `scripts/check-secrets.mjs`; `node scripts/check-secrets.mjs --dist` scans the built output.
