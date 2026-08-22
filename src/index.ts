/**
 * @sudobility/music_types — types and Zod schemas for the Moosiac music family.
 *
 * Single sectioned entry point (sudojo_types convention):
 *   1. Score model types (spec §4 of the Moosiac spec)
 *   2. Type guards
 *   3. Selection / fragment types
 *   4. Zod schemas for the score tree
 *   5. AI generation contracts (requests, results, provider interface)
 *   6. Zod schemas for the generation contracts
 *   7. Project API types (music_api payloads)
 *   8. Zod schemas for the project API
 *   9. Response envelope + error codes
 *
 * Contains the types and schemas, plus the pure domain primitives both sides
 * of the system need: pitch and tick math, the score factory, quantization,
 * ties and voice allocation.
 *
 * Those primitives used to live in `@sudobility/music_lib`, which put them out
 * of reach of the backend — `music_api` must never depend on `music_lib`, and
 * neither may depend on the other. Anything both sides need lives here or in
 * `@sudobility/music_codecs`; `music_lib` keeps what is frontend-only (store,
 * commands, rendering, playback).
 */

// ---------------------------------------------------------------------------
// The model, its schemas and the API payloads.
//
// These used to be declared inline here, which made this file 1,463 lines and
// the model hard to find in it. They now live in `src/model/` and are
// re-exported, so the package presents exactly the same surface.
// ---------------------------------------------------------------------------
export * from "./model/score.js";
export * from "./model/schemas.js";
export * from "./model/generation.js";
export * from "./model/api.js";

// ---------------------------------------------------------------------------
// 10. Platform interfaces (implementations live in @sudobility/music_io)
// ---------------------------------------------------------------------------
export * from "./platform/index.js";

// ---------------------------------------------------------------------------
// 10. Pure domain primitives (shared by frontend and backend)
// ---------------------------------------------------------------------------

export * from "./domain/pitch/pitch.js";
export * from "./domain/pitch/transpose.js";
export * from "./domain/quantization/options.js";
export * from "./domain/quantization/quantize.js";
export * from "./domain/score/factory.js";
export * from "./domain/score/fragment.js";
export * from "./domain/score/ids.js";
export * from "./domain/score/queries.js";
export * from "./domain/score/ties.js";
export * from "./domain/selection/types.js";
export * from "./domain/time/durations.js";
export * from "./domain/time/fraction.js";
export * from "./domain/time/tempo-map.js";
export * from "./domain/time/ticks.js";
export * from "./domain/voicing/allocate.js";
export * from "./domain/validation/issues.js";
export * from "./domain/validation/validator.js";

// ---------------------------------------------------------------------------
// 11. Score commands (pure Score -> Score transformations, shared by both sides)
// ---------------------------------------------------------------------------

export * from "./domain/commands/types.js";
export * from "./domain/commands/reflow.js";
export * from "./domain/commands/snapshot.js";
export * from "./domain/commands/structure-commands.js";
export * from "./domain/commands/track-commands.js";
export * from "./domain/commands/region-commands.js";
export * from "./domain/commands/note-commands.js";
export * from "./domain/commands/note-marks.js";
export * from "./domain/commands/edit-commands.js";
export * from "./domain/commands/relocate-commands.js";
export * from "./domain/commands/ripple-commands.js";
export * from "./domain/instruments/gm.js";
export * from "./domain/instruments/gm-kit.js";
export * from "./domain/instruments/gm-range.js";
export * from "./domain/instruments/gm-polyphony.js";
export * from "./domain/instruments/gm-transposition.js";
export * from "./domain/instruments/gm-percussion.js";
export * from "./domain/selection/selection.js";
export * from "./services/regeneration/controller.js";

// Absorbed from music_lib: pure, synchronous, dependency-free model code
// that both the app and the server need.
export * from "./domain/commands/history.js";
export * from "./domain/generation/replacement-region.js";
export * from "./domain/instruments/gm-icon.js";
export * from "./domain/instruments/icon-art.js";
export * from "./domain/instruments/instrument-fit.js";
export * from "./domain/instruments/instrument-options.js";
export * from "./domain/instruments/track-instrument.js";
export * from "./domain/notation/chord-symbol.js";
export * from "./domain/notation/lyric-syllables.js";
export * from "./domain/notation/music-vocabulary.js";
export * from "./domain/score/articulation.js";
export * from "./domain/score/bar-numbers.js";
export * from "./domain/score/collapse-rests.js";
export * from "./domain/score/cue-notes.js";
export * from "./domain/score/dynamics.js";
export * from "./domain/score/effective-clef.js";
export * from "./domain/score/extract-part.js";
export * from "./domain/score/fermata-tempo.js";
export * from "./domain/score/flatten.js";
export * from "./domain/score/ottava.js";
export * from "./domain/score/performance-timeline.js";
export * from "./domain/score/rehearsal-marks.js";
export * from "./domain/score/repeat-order.js";
export * from "./domain/score/snapshot-tree.js";
export * from "./domain/score/written-pitch.js";
export * from "./domain/selection/range-select.js";
export * from "./domain/selection/selection-editing.js";
export * from "./domain/time/duration-modifiers.js";
export * from "./domain/time/duration-selection.js";
export * from "./domain/time/tap-to-note.js";
export * from "./domain/time/tuplets.js";
