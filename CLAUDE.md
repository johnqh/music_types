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

- **One row per General MIDI program, and every row says where its numbers came from** (`gm-catalogue.ts`). Range, polyphony and transposition used to be three tables of family defaults plus a handful of per-program overrides — which looked like deduplication and was not: 90 of the 128 programs inherited a compass nobody had chosen for them, and an inherited value was indistinguishable from a researched one. It hid a real bug (**Muted Trumpet** had no transposition entry, so a B-flat trumpet with a mute in the bell was treated as non-transposing and its part displayed a whole tone wrong), gave the **Clavinet** an 88-key piano compass where it has 60 keys F1-E6, and handed the flute's exact range to five instruments that share none of it. The repetition where eight guitars genuinely share a compass is the point: writing it eight times is a decision somebody made, where inheriting it eight times is a question nobody was asked. **`basis` is the field to read before trusting a number** — `measured` (checked against a source), `synthetic` (an electronic patch has no acoustic compass, so it gets the whole keyboard rather than an invented limit), `unpitched` (a sound effect), and `assumed` (**not verified**, carried over from the old default, left deliberately wide). No row is left `assumed`: the 31 that were have each been settled, most by looking the instrument up and ten by finding that the honest answer is `tunable` — a shamisen is tuned to the singer, a koto to the piece, an mbira to notes that are not on the tempered scale at all, and a pan flute or hammered dulcimer is built in many sizes; refusing a note against those would be refusing against the sampler rather than the instrument. Section patches (`String Ensemble`, `Brass Section`) take the **union of the instruments in them, computed rather than typed**, so a string section cannot end up narrower than the cello inside it. Where General MIDI names a family rather than an instrument the row covers the common members: "Recorder" is soprano and alto together, "Bagpipe" is the Highland chanter's nine notes and the uilleann's two octaves together — the Highland compass alone is fifteen semitones and rejected honest music. The split is now 75 measured, 30 synthetic, 13 unpitched, 10 tunable. `gmRangeIsBinding` answers `true` only for `measured`, and the generation inspector consults it before reporting an out-of-range note: refusing a note against a compass nobody checked rejects music that was fine, and since that finding drives a retry it would spend real money arguing about a limit we invented.

- **A regeneration request says who is playing, and a kit gets told how a kit is written.** A `ScoreFragment` is measures and nothing else — no name, no clef, no program — so "Replace Track" used to hand the model anonymous bars and let it infer the instrument from the notes in front of it. On a drum track there is nothing to infer from: the pitches are drum numbers, not notes. Measured on a real Power Kit regeneration, the result was the kick on every eighth of all 118 bars at a constant velocity 100, the snare on all four beats instead of the backbeat, and five of the 47 drums used — a metronome, not a groove. `RegenerateRegionRequest.tracks` now carries a `GenerateScoreRequestTrack` per fragment track, built by `describeTrackForGeneration` in music_types so whole-score generation and regeneration describe a track the *same* way; the range and polyphony come from `trackKeyboardRange`/`trackMaxPolyphony`, which answer about the **kit** on a percussion track rather than about whatever melodic program shares its number. The roster is matched to the fragment **by position**, so `buildRegeneratePrompt` emits it only when the lengths agree — a roster of a different length is not partial information but wrong information, naming the kit as the cello. And `percussionRules()` — previously generate-only, and previously just the GM map — now travels on both paths and states the two Expression rules that **invert** for percussion: an accent is the rule rather than the exception (velocity variation between accented and ghost notes *is* the groove), and a kit does play continuously even though each individual drum still rests. The map alone is not enough, which is the thing that had to be measured to be believed.

- **One fact, one declaration — and `src/__single-source.test.ts` enforces it.** A constant restated in a second package agrees with the first right up until one of them is edited, and nothing fails when they part: the build is clean, the types match, and the only symptom is a wrong sound or a picker quietly missing an entry. Measured across the family, 23 UPPER_CASE constants were declared in more than one repo — `CC_VOLUME` three times, `DYNAMICS` four, `C_MAJOR` five, and `DEFAULT_TIME_SIGNATURE` in four places under two names. The guard reads the list of names **from music_types at runtime** rather than restating it, because a check against duplication that duplicates what it checks would drift like everything else; its `ALLOWED` list is empty on purpose, so an exemption is a decision somebody writes down. Two shapes matter beyond the constants themselves. **A closed vocabulary is declared as an array and the type read off it** (`export const DYNAMICS = [...] as const; export type Dynamic = (typeof DYNAMICS)[number];`) — a TypeScript union has no runtime form, so anything that must *validate* a value has to write the list out again, which is exactly how music_api's decoder came to check generated music against its own private copy. **A label or option list keyed by the vocabulary is a `Record<T, ...>`, never a parallel array** — a record fails to compile when a member is added, an array silently goes on offering the old set; that is why the inspector's picker lists are `ACCIDENTAL_OPTIONS`/`ARTICULATION_OPTIONS` built from the vocabulary rather than `ACCIDENTALS`/`ARTICULATIONS` retyped. Test fixtures follow the same rule: the score fixtures live once, in `@sudobility/music_types/test`, and a package that needs a rendering fixture of its own re-exports them and adds to them.

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
- **Saying a stored value the way a musician says it belongs here**
  (`music-vocabulary.ts`). A score stores ticks, fifths and zero-based voice
  indexes because those are the right things to compute with, and none of them
  is the right thing to *show* — `Duration 480` and `Key (fifths) 2` state the
  storage format. The conversions are facts about music rather than details of
  a panel, and there are now **two** apps drawing the same panels, which is
  what settles where they live: a display conversion transcribed into the
  native app agrees with the web's copy right up until one of them is edited,
  and nothing fails when they part. `panReadout` arrived exactly that way — it
  was three lines in `music_app/src/features/tracks/pan-readout.ts` and three
  identical lines in music_app_rn the moment the native property sheet gained a
  pan row. A conversion qualifies for this file under the same four rules as
  anything else here: it works on both sides, adds no dependency, has no hook
  and no async in it. No user-facing prose, though — note values and key names
  are terms of the domain, fixed across locales the way General MIDI's
  instrument names are, but anything a translator would touch is the app's.

- **A guard test enforces that this package runs on React Native** (`src/platform-free.test.ts`): no web-only global and no `import.meta`. This matters more here than anywhere else — these are the platform *interfaces* every other repo implements, so one DOM type in a signature spreads to all of them. That is why `FileExporter.save` takes `Uint8Array | string` rather than a `Blob`, and the codecs take `ArrayBuffer`. `tsconfig.json` still sets `lib: [..., "DOM"]` (for `AbortSignal`) and `eslint.config.js` still spreads `globals.browser`, so nothing else would object.

## Related Projects

- `music_api` — backend (Hono/Drizzle/OpenAI proxy), consumes schemas for validation
- `music_client` — typed network client + React Query hooks
- `music_lib` — domain logic, adapters, store
- `music_app` — web app (UI/routing only)

## Git Workflow

- Do not use feature branches for code changes. Always stay on the current branch.
