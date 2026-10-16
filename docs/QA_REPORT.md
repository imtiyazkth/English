# QA report

Environment note: the build sandbox could not reach the npm registry (policy-blocked), so `npm install` was **not** run, and the Vite build, Vitest and any browser testing were **not** run. Verification used the tools available locally.

## Run and passed
| Check | Result |
|---|---|
| `tsc --strict` on `src/utils`, `src/data`, `src/services`, `src/types`, `functions` | 0 errors |
| `tsc --strict` on all React code against permissive stub typings for `react`/`lucide-react` | 0 errors in app code (one real bug found and fixed in Tutor.tsx; remaining notes were only missing Vite env types) |
| esbuild bundle of `src/main.tsx` (react/lucide external) | succeeded |
| All 7 test files executed through a small `describe/it/expect` shim | 109 passed, 0 failed |
| `node scripts/check-secrets.mjs` | OK |

Tests cover: dates/streaks, spaced repetition, text grading, progress/data migration, export/import validation, selectors, quiz builder, curriculum integrity (every exercise accepts its own model answer), persistence fallbacks, router helpers, and the tutor backend (validation, size limits, prompt building, response parsing, throttle).

## NOT run — please do on your machine
1. `npm install` → creates `package-lock.json` (none is included).
2. `npm run check`, `npm test` (real Vitest), `npm run build`.
3. Manual browser pass: onboarding, a lesson, flashcards, offline mode, install prompt, dark mode, export/import.
4. Test on a real phone: TTS, speech recognition (browser-dependent), layout, safe-area insets.
5. `npx wrangler pages dev dist` with your own key to test the Tutor.
6. Lighthouse / accessibility audit.
The UI has never been rendered; there may be visual or runtime issues. There are no component or end-to-end tests yet.

## Known limitations
- Seeded curriculum only (14 lessons); see CURRICULUM.md. Hindi text has not been reviewed by a native teacher.
- 9 exercise types implemented (the brief listed more variants).
- Speaking feedback compares recognised words; it is not a pronunciation score.
- Writing feedback is rule-based, not an AI grader.
- Tutor throttling is best-effort; the shared key has one quota for all users.
- Service worker behaviour has not been tested in a browser.
