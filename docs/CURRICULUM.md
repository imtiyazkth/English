# Curriculum

## Levels
Zero English / Pre-A1 → A1 → A2 → B1 → B2 → C1 (CEFR-inspired; this is not an official certification).

## What is seeded today
| Level | Lessons |
|---|---|
| Pre-A1 | 5 |
| A1 | 3 |
| A2 | 2 |
| B1 | 2 |
| B2 | 1 |
| C1 | 1 |

Total: 14 lessons, 198 exercises, 62 vocabulary words, 28 grammar topics, 7 reading passages, 8 speaking tasks, 6 writing tasks, placement check, listening sets and pronunciation drills.

**This is a representative slice, not a complete course.** B2/C1 especially need many more lessons before the app can honestly claim full coverage.

## Adding a lesson
1. Add an object to the relevant file in `src/data/lessons-*.ts` using the helpers in `src/data/builders.ts` (`mcq`, `fill`, `hiEn`, `enHi`, `arrange`, `match`, `dictation`, `correct`, `speak`, `write`).
2. Give it a unique `id`, a `stage`, optional `prerequisite`, Hindi explanation (`explanationHi`), teaching points and at least 6 exercises, each with an `explanationHi`.
3. Add any new words to `src/data/vocab.ts` and reference them via `vocab: [...]`.
4. Run `npm test` — `tests/curriculum.test.ts` checks unique ids, valid links, well-formed exercises and that every exercise accepts its own model answer.

Have a fluent Hindi/English teacher review new content before release.
