# @sudobility/music_types

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it.

TypeScript types and Zod schemas for the Moosiac music family (music_api, music_client, music_lib, music_app).

## Tech Stack

- TypeScript (strict), ESM only, built with `tsc -p tsconfig.esm.json`
- Zod v4 schemas (runtime dependency — schemas are exported values)
- Bun for scripts, vitest for tests
- Published to npm as `@sudobility/music_types` (public access) via CI on push to main

## Commands

- `bun install` — install dependencies
- `bun run verify` — typecheck + lint + test + build (run before any push)
- `bun run test` — vitest (tests co-located in `src/*.test.ts`)
- `bun run build` — emit `dist/`

## Structure

Everything exports from a single sectioned `src/index.ts`:

1. Score model types (Score/Track/Measure/Voice/NoteEvent/RestEvent, DurationName, Clef, …)
2. Type guards (`isNoteEvent`, `isRestEvent`)
3. Selection/fragment types (`ScoreRange`, `ScoreSelection`, `ScoreFragment`)
4. Zod schemas for the score tree (`scoreSchema`, `parseScore`, …)
5. AI generation contracts (`GenerateScoreRequest` → `GenerateScoreResult`, `RegenerateRegionRequest` → `RegenerateRegionResult`, `MusicGenerationProvider`)
6. Zod schemas for the generation contracts (`parseGenerateScoreRequest`, …)
7. Project API types (`ProjectRecord`, `ProjectSummary`, `ProjectCreateRequest`, `ProjectUpdateRequest`, `ProjectListQuery`)
8. Zod schemas for the project API
9. Response envelope (`ApiResponse<T>`, `successResponse`, `errorResponse`, `API_ERROR_CODES`)

`src/test-helpers.ts` is a test-only factory stand-in (excluded from the published build); the real factories live in `@sudobility/music_lib`.

## Gotchas

- **The playhead is the one stateful service in this package, and that is a
  deliberate precedent.** `MusicPosition` and its singleton live in
  `src/position/`. Everything else here is model and primitives; the playhead
  earns the exception because it has exactly one writer
  (`@sudobility/music_player`) and readers in every other package — the caret,
  the note highlighting, the piano keyboard — so any other home creates a
  dependency edge that exists only to reach it. It still obeys the four rules:
  works on both sides, no dependency, no hooks, no async.
- **`base64.ts` is here because its two consumers ended up in different
  packages.** `music_io`'s React Native file exporter encodes; `music_player`'s
  sample-pack loader decodes. The module exists precisely so there is one
  alphabet and one round-trip test rather than a copy each — splitting it would
  break the property it was written to guarantee.
- **The playback *plan* is here; the engine *contract* is not.** `PlaybackPlan`
  composes `PerformanceTimeline`, which `performanceTimeline()` in
  `domain/score/` produces, so the whole plan cluster is anchored here — moving
  it would make this package import from `music_player`. `PlaybackEngine`,
  `PlaybackObserver` and `AuditionVoice` did move, because that package is the
  only thing that implements or calls them.

- No domain logic here: tick math, factories, commands, validation logic all live in `@sudobility/music_lib`. This package must never depend on music_lib (music_api depends on this package and must not pull in UI/audio code).
- `noteEventSchema`/`restEventSchema` are `.strict()` on purpose (a stray `pitch` key must not pass as a rest); other schemas strip unknown keys for forward compatibility.
- Ticks are integers at 480 PPQ by convention; `startTick` is absolute.
- **A guard test enforces that this package runs on React Native** (`src/platform-free.test.ts`): no web-only global and no `import.meta`. This matters more here than anywhere else — these are the platform *interfaces* every other repo implements, so one DOM type in a signature spreads to all of them. That is why `FileExporter.save` takes `Uint8Array | string` rather than a `Blob`, and the codecs take `ArrayBuffer`. `tsconfig.json` still sets `lib: [..., "DOM"]` (for `AbortSignal`) and `eslint.config.js` still spreads `globals.browser`, so nothing else would object.

## Related Projects

- `music_api` — backend (Hono/Drizzle/OpenAI proxy), consumes schemas for validation
- `music_client` — typed network client + React Query hooks
- `music_lib` — domain logic, adapters, store
- `music_app` — web app (UI/routing only)

## Git Workflow

- Do not use feature branches for code changes. Always stay on the current branch.
