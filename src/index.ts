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
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. Score model types
// ---------------------------------------------------------------------------

export type UUID = string;

export type Fraction = { numerator: number; denominator: number };

export type PitchStep = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** -2 = double flat, -1 = flat, 0 = natural, 1 = sharp, 2 = double sharp. */
export type Accidental = -2 | -1 | 0 | 1 | 2;

export type Pitch = { step: PitchStep; accidental: Accidental; octave: number };

export type TimeSignature = { numerator: number; denominator: number };

export type KeySignature = { fifths: number; mode: 'major' | 'minor' };

export type TempoEvent = { id: UUID; tick: number; bpm: number };

/**
 * Renderable note-duration names: base values (whole down to thirty-second),
 * their dotted (1.5x) variants, and their triplet (2/3x) variants.
 */
export type DurationName =
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'
  | 'thirtysecond'
  | 'dotted-whole'
  | 'dotted-half'
  | 'dotted-quarter'
  | 'dotted-eighth'
  | 'dotted-sixteenth'
  | 'dotted-thirtysecond'
  | 'triplet-whole'
  | 'triplet-half'
  | 'triplet-quarter'
  | 'triplet-eighth'
  | 'triplet-sixteenth'
  | 'triplet-thirtysecond';

export type Articulation = 'staccato' | 'accent' | 'tenuto' | 'marcato';

/**
 * An ornament sign written over a note.
 *
 * The *sign*, not the notes it stands for: a trill is stored as "trill" rather
 * than expanded into the alternation a player would produce, because the
 * realisation depends on period, tempo and taste, and expanding it would make
 * the ornament impossible to remove or re-read. Written-out ornaments are a
 * different thing entirely and already have one — `NoteEvent.graceNotes`.
 *
 * Named the way a musician names them: `mordent` is the one *with* the
 * vertical stroke and `inverted-mordent` the one without. (VexFlow's own codes
 * use these two words the other way round — see `convert.ts`.)
 */
export type Ornament = 'trill' | 'mordent' | 'inverted-mordent' | 'turn';

/**
 * A gradual change of loudness, written as a wedge under the stave.
 *
 * The other half of `Dynamic`: a dynamic is a *level* that holds until the
 * next one, and a hairpin is the *change* between two of them. Most dynamic
 * writing is hairpins, so a score that had only levels could say "loud here"
 * but never "get louder".
 */
export type Hairpin = 'crescendo' | 'diminuendo';

/**
 * An octave-displacement bracket: play the written notes an octave (or two)
 * away from where they sit.
 *
 * `8va`/`15ma` are above, `8vb`/`15mb` below. The model stores **sounding**
 * pitch as it always has, so the bracket is purely a display instruction — it
 * says "these were written an octave lower to keep them on the stave", and the
 * display lens moves them there. That is the only way it can work here: a
 * model that stored written pitch would make an ottava change what a note
 * *sounds* like, which is the opposite of what the mark means.
 */
export type Ottava = '8va' | '8vb' | '15ma' | '15mb';

/**
 * The line drawn at the end of a bar, where it is not an ordinary single one.
 *
 * Only the two that carry meaning a reader acts on: `double` marks a section
 * break, and `final` ends the piece. The repeat barlines are deliberately not
 * in here — they live on `repeatStart`/`repeatEnd` because they are two
 * independent flags rather than one choice, and a bar can both end a repeat
 * and end the piece.
 */
export type BarlineStyle = 'double' | 'final';

/**
 * A jump instruction written at the end of a bar.
 *
 * The six a player actually meets. Each says two things — where to go back to
 * (the start for a *capo*, the sign for a *segno*) and where to stop or leave
 * (the end, `fine`, or the coda) — which is why they are one enum rather than
 * a direction and a target composed separately: only these combinations are
 * written, and the pairs that are not written should not be expressible.
 */
export type RepeatJump =
  | 'da-capo'
  | 'da-capo-al-fine'
  | 'da-capo-al-coda'
  | 'dal-segno'
  | 'dal-segno-al-fine'
  | 'dal-segno-al-coda';

/**
 * A dynamic marking, from softest to loudest.
 *
 * Attached to the note it applies *from*, and in force until the next one on
 * that track — which is how a dynamic is read on paper and how it is played.
 * Stored as the marking rather than as a velocity, because "mf" is what the
 * score says; the velocity a player gives it is derived (`velocityForDynamic`
 * in music_lib) and stays adjustable per note on top.
 */
export type Dynamic = 'ppp' | 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'fff';

/**
 * How a sung syllable joins its neighbours.
 *
 * MusicXML's own vocabulary, kept rather than invented: it is what decides
 * whether a hyphen is drawn to the next note. "beau-ti-ful" over three notes
 * is `begin`, `middle`, `end`; a one-syllable word is `single`.
 */
export type Syllabic = 'single' | 'begin' | 'middle' | 'end';

/**
 * A small ornamental note played just before the note it decorates.
 *
 * Attached to that note rather than sitting in the voice as an event of its
 * own, because a grace note **takes no time from the bar** — it borrows from
 * its principal. As an event it would have to be excluded from every sum that
 * checks a measure adds up: validation, rest filling, quantization, the
 * VexFlow voice. Hanging it off the note it ornaments means none of those
 * change at all, and it moves, copies and deletes with its principal, which is
 * what a player expects of an ornament.
 *
 * `durationTicks` is the *written* value — what decides the glyph and how many
 * flags it gets — not time taken from the measure.
 */
export type GraceNote = {
  pitch: Pitch;
  durationTicks: number;
  /**
   * A slash through the stem: an acciaccatura, crushed against the principal.
   * Without it the note is an appoggiatura, which takes noticeably longer.
   */
  slashed?: boolean;
};

/** One syllable sung on one note. */
export type Lyric = {
  text: string;
  /** Absent means `single` — a whole word on one note, which is the common case. */
  syllabic?: Syllabic;
};

/** Softest first, which is the order a picker should offer them in. */
export const DYNAMICS: readonly Dynamic[] = [
  'ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff',
] as const;

export type Clef = 'treble' | 'bass' | 'alto' | 'tenor' | 'percussion';

export type NoteEvent = {
  id: UUID;
  pitch: Pitch;
  startTick: number;
  durationTicks: number;
  velocity: number;
  voiceId: UUID;
  trackId: UUID;
  tieStart?: boolean;
  tieStop?: boolean;
  articulation?: Articulation;
  /**
   * A pause held on this note, at the performer's discretion.
   *
   * Separate from `articulation` although it draws like one, because it is not
   * one: an articulation says how a note of a written length is played, while a
   * fermata says the written length is *suspended*. Putting it in the
   * `Articulation` enum would have made it mutually exclusive with staccato and
   * accent, and a fermata over an accented final chord is ordinary notation.
   *
   * Boolean rather than a duration: how long a fermata is held is the
   * performer's judgement, not the score's, which is the whole point of the
   * marking.
   */
  fermata?: boolean;
  /**
   * An ornament sign over this note — a trill, mordent or turn.
   *
   * Beside `graceNotes` rather than replacing it: an ornament *sign* leaves
   * its realisation to the player, while grace notes spell out exactly what is
   * played. A note can carry both, which is how an ornament with a written-out
   * termination is notated.
   */
  ornament?: Ornament;
  /** Dynamic marking starting at this note; in force until the next one. */
  dynamic?: Dynamic;
  /**
   * Phrase mark endpoints.
   *
   * Deliberately separate from `tieStart`/`tieStop`, which look the same on
   * paper and mean something else entirely: a tie joins two notes *of the same
   * pitch* into one sounding note, and playback joins their durations. A slur
   * groups a run of *different* pitches as one phrase and joins nothing — so
   * `joinTiedNotes` must never see these, and it does not.
   */
  slurStart?: boolean;
  slurStop?: boolean;
  /**
   * The ends of a hairpin.
   *
   * Shaped exactly like `slurStart`/`slurStop`, because a hairpin is the same
   * kind of object — a span with two endpoints, written across a run of notes.
   * The *start* carries the direction, since that is what the wedge's opening
   * says; the stop only has to say where it closes.
   *
   * Kept apart from `dynamic`, which marks a level beginning at a note, for
   * the reason the two are different marks on paper: a hairpin can run between
   * two dynamics, from one without a following one, or over notes that carry
   * no dynamic at all.
   */
  hairpinStart?: Hairpin;
  hairpinStop?: boolean;
  /**
   * Roll this chord rather than striking it together.
   *
   * A flag per note, although the mark belongs to the *chord*, because a chord
   * here is several `NoteEvent`s sharing a tick — there is no chord object to
   * hang it on. That is also MusicXML's shape: `<arpeggiate/>` appears on every
   * note of the chord, not once.
   *
   * On a single note it means nothing and draws nothing: there is only one
   * notehead to roll through.
   */
  arpeggiate?: boolean;
  /**
   * The ends of an octave bracket, shaped like the hairpin and the slur.
   *
   * The start carries the displacement; the stop only says where it closes.
   */
  ottavaStart?: Ottava;
  ottavaStop?: boolean;
  /**
   * The ends of a slide between two notes.
   *
   * A span like a slur rather than a flag meaning "slide to the next note",
   * so that an exported `<glissando type="start"/>`/`stop` pair round-trips as
   * what it is, and so a slide across a rest cannot be expressed by accident.
   */
  glissandoStart?: boolean;
  glissandoStop?: boolean;
  /**
   * The finger to play this note with.
   *
   * A string, not a number: piano writing uses `1`-`5`, guitar adds `T` for
   * the thumb, and editions write `1-2` for a substitution. Storing what the
   * engraver typed keeps all three, and nothing here needs to do arithmetic
   * on it.
   */
  fingering?: string;
  /**
   * The syllable sung on this note.
   *
   * On the note rather than in a parallel list because that is what a lyric
   * is: text belonging to a notehead, which moves, copies and deletes with it.
   * A separate track of syllables would have to be re-aligned after every edit
   * that changed the note count.
   */
  lyric?: Lyric;
  /** Ornaments played immediately before this note, in the order written. */
  graceNotes?: GraceNote[];
  /**
   * A chord symbol printed above the stave from this note, e.g. `Cmaj7`.
   *
   * Stored as the text a player reads rather than as a parsed root and
   * quality. A lead sheet's vocabulary is wide and inconsistent — `C-7`,
   * `Cmin7` and `Cm7` are one chord written three ways, and `F/A`, `Bb7#11`
   * and `Cmaj7(add13)` all have to survive being typed — so keeping the string
   * means nothing a player writes is refused or silently rewritten. Export
   * parses the root out of it for MusicXML and carries the rest verbatim.
   *
   * Attached to a note, like a lyric, because that is where it is read from:
   * the chord changes *at* a note. A change during a held note has to wait for
   * the next onset, which is the one thing this shape cannot express.
   */
  chordSymbol?: string;
};

export type RestEvent = {
  id: UUID;
  startTick: number;
  durationTicks: number;
  voiceId: UUID;
  trackId: UUID;
};

export type MusicalEvent = NoteEvent | RestEvent;

export type Voice = { id: UUID; name: string; events: MusicalEvent[] };

/**
 * Small-print notes from another instrument, printed in the bar before a long
 * entry so the player knows where they are.
 *
 * Print-only and derived (see `measureCues` in music_lib). Deliberately not
 * part of `Measure.voices`: a cue is not the player's music, and keeping it
 * out is what lets playback, export, selection and note-counting stay correct
 * without learning to skip it.
 */
export type MeasureCue = {
  /** Which instrument this is, e.g. "Flute". Drawn above the notes. */
  label: string;
  /** The cued bar's notes. Never sounded, never selectable. */
  events: MusicalEvent[];
};

export type Measure = {
  id: UUID;
  index: number;
  startTick: number;
  durationTicks: number;
  timeSignature: TimeSignature;
  keySignature: KeySignature;
  voices: Voice[];
  /**
   * How many measures of silence this one stands for, when it is a
   * multi-measure rest. Absent for an ordinary measure.
   *
   * Only ever set on a derived, print-only part (see `extractPart` in
   * music_lib). A stored score always writes its rests out in full, because
   * collapsing loses which bar is which — and the editor needs every bar.
   */
  multiMeasureRestCount?: number;
  /**
   * Rehearsal mark shown above this measure, e.g. "B".
   *
   * Print-only and derived (see `rehearsalMarks` in music_lib): a stored score
   * carries none, and the editor never shows them, because a mark you cannot
   * move would be a control that looks editable and is not.
   */
  rehearsalMark?: string;
  /**
   * The `|:` and `:|` barlines of a repeated section.
   *
   * Two independent flags rather than a span, because that is how they are
   * written and how they behave: a `:|` with no matching `|:` repeats from the
   * start of the piece, which is a real and common marking rather than an
   * error to be prevented.
   *
   * **Notation and export only, for now.** Playback plays straight through a
   * repeat. Expanding it would break the identity that a playback tick *is* a
   * score tick, which the caret, the following-scroll, "play from here" and
   * the position scrubber all rest on — that needs a tick mapping threaded
   * through all four, and it is deliberately a separate change.
   */
  repeatStart?: boolean;
  repeatEnd?: boolean;
  /**
   * Which passes through a repeat this bar is played on — a volta.
   *
   * Carried on **every** bar of the ending, not just its first, so the bracket
   * can be derived from runs of equal numbers rather than stored as a span.
   * Deleting a bar out of a first ending then shortens the bracket instead of
   * leaving one that points at nothing, the same reason a tuplet is derived.
   *
   * `[1]` is a first ending; `[1, 2]` is a bar played on both passes.
   */
  endingNumbers?: number[];
  /** Cue notes printed in this measure. Print-only. */
  cue?: MeasureCue;
  /**
   * A heavier line at the end of this bar: a section break, or the end.
   *
   * Absent means the ordinary single barline, which is almost every bar — so
   * the field is the exception rather than a value repeated on every measure.
   */
  barline?: BarlineStyle;
  /**
   * The navigation marks a player follows, each on the bar that carries it.
   *
   * `segno` and `coda` are *places* — the sign to come back to, and where the
   * closing section begins. `toCoda` is the place you **leave** from on the
   * way to the coda, which is a different bar from the coda itself and is why
   * the two cannot be one flag. `fine` is where the piece ends on a later
   * pass, which is usually not the last bar.
   *
   * `jump` is the *instruction*, and it sits on the bar at whose end it is
   * obeyed. Everything else here is a target it may name.
   */
  segno?: boolean;
  coda?: boolean;
  toCoda?: boolean;
  fine?: boolean;
  jump?: RepeatJump;
  /**
   * Whether this bar is a pickup — an anacrusis, not counted in the numbering.
   *
   * A flag rather than "measure 0 is short", because those are different
   * things: a short bar can also be a deliberate irregular bar mid-score, and
   * a pickup is defined by *not being counted*. The bar after a pickup is
   * bar 1, which is the whole visible consequence.
   *
   * Its shortness lives where it already did, in `durationTicks` — a `Measure`
   * has always carried its own length independently of its time signature, so
   * validation (which sums voices against `durationTicks`) needed no change.
   *
   * This is MusicXML's `implicit="yes"`, which is the same idea.
   */
  pickup?: boolean;
  /**
   * A clef change taking effect at this measure.
   *
   * Absent means "carry on with whatever is in force" — the previous measure's
   * change, or `Track.clef` if none has happened yet. Storing only the
   * *changes* rather than a clef on every bar is what makes the common case
   * (a part that never changes clef) identical to what it was before this
   * existed, and it means inserting or deleting a bar cannot silently strand a
   * clef that was only ever inherited.
   *
   * Keyboard, cello and bassoon parts are unreadable without this: a piano
   * left hand crosses into treble constantly, and before this the whole track
   * had one clef and an imported change was dropped.
   */
  clef?: Clef;
};

export type Track = {
  id: UUID;
  name: string;
  instrumentName: string;
  midiProgram: number;
  midiChannel: number;
  clef: Clef;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  measures: Measure[];
};

export type ScoreMetadata = {
  title: string;
  composer?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type Score = {
  id: UUID;
  version: number;
  ppq: number;
  metadata: ScoreMetadata;
  tempoMap: TempoEvent[];
  tracks: Track[];
};

// ---------------------------------------------------------------------------
// 2. Type guards
// ---------------------------------------------------------------------------

/** True for `NoteEvent`s (distinguished from `RestEvent` by the `pitch` property). */
export function isNoteEvent(event: MusicalEvent): event is NoteEvent {
  return 'pitch' in event;
}

/** True for `RestEvent`s (distinguished from `NoteEvent` by lacking a `pitch` property). */
export function isRestEvent(event: MusicalEvent): event is RestEvent {
  return !('pitch' in event);
}

// ---------------------------------------------------------------------------
// 3. Selection / fragment types
// ---------------------------------------------------------------------------

/** A tick range scoped to a set of tracks (e.g. a loop region or regeneration target). */
export type ScoreRange = { startTick: number; endTick: number; trackIds: string[] };

export type ScoreSelection = {
  eventIds: string[];
  measureIds: string[];
  trackIds: string[];
  range?: ScoreRange;
};

/** A region of a score extracted for regeneration/preview: measures per track over a range. */
export type ScoreFragment = {
  range: ScoreRange;
  ppq: number;
  tracks: Array<{ trackId: UUID; measures: Measure[] }>;
};

// ---------------------------------------------------------------------------
// 4. Zod schemas for the score tree
// ---------------------------------------------------------------------------
// Runtime constraints: velocity 0-127, midiProgram 0-127, midiChannel 0-15,
// ppq positive int, accidental -2..2, octave -1..9. `noteEventSchema` /
// `restEventSchema` are `.strict()` so an object with a stray `pitch` field
// cannot be silently accepted as a rest (and vice versa); every other schema
// stays permissive to tolerate forward-compatible additions.

export const uuidSchema = z.string().min(1);

export const pitchStepSchema = z.enum(['C', 'D', 'E', 'F', 'G', 'A', 'B']);

export const accidentalSchema = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

export const pitchSchema = z.object({
  step: pitchStepSchema,
  accidental: accidentalSchema,
  octave: z.number().int().min(-1).max(9),
});

export const timeSignatureSchema = z.object({
  numerator: z.number().int().positive(),
  denominator: z.number().int().positive(),
});

export const keySignatureSchema = z.object({
  fifths: z.number().int(),
  mode: z.enum(['major', 'minor']),
});

export const tempoEventSchema = z.object({
  id: uuidSchema,
  tick: z.number().int().nonnegative(),
  bpm: z.number().positive(),
});

export const articulationSchema = z.enum(['staccato', 'accent', 'tenuto', 'marcato']);
export const hairpinSchema = z.enum(['crescendo', 'diminuendo']);
export const ottavaSchema = z.enum(['8va', '8vb', '15ma', '15mb']);
export const barlineStyleSchema = z.enum(['double', 'final']);
export const repeatJumpSchema = z.enum([
  'da-capo',
  'da-capo-al-fine',
  'da-capo-al-coda',
  'dal-segno',
  'dal-segno-al-fine',
  'dal-segno-al-coda',
]);
export const ornamentSchema = z.enum([
  'trill',
  'mordent',
  'inverted-mordent',
  'turn',
]);
export const dynamicSchema = z.enum(['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff']);

export const clefSchema = z.enum(['treble', 'bass', 'alto', 'tenor', 'percussion']);

export const noteEventSchema = z
  .object({
    id: uuidSchema,
    pitch: pitchSchema,
    startTick: z.number().int().nonnegative(),
    durationTicks: z.number().int().positive(),
    velocity: z.number().int().min(0).max(127),
    voiceId: uuidSchema,
    trackId: uuidSchema,
    tieStart: z.boolean().optional(),
    tieStop: z.boolean().optional(),
    articulation: articulationSchema.optional(),
    fermata: z.boolean().optional(),
    ornament: ornamentSchema.optional(),
    dynamic: dynamicSchema.optional(),
    slurStart: z.boolean().optional(),
    slurStop: z.boolean().optional(),
    hairpinStart: hairpinSchema.optional(),
    hairpinStop: z.boolean().optional(),
    arpeggiate: z.boolean().optional(),
    ottavaStart: ottavaSchema.optional(),
    ottavaStop: z.boolean().optional(),
    glissandoStart: z.boolean().optional(),
    glissandoStop: z.boolean().optional(),
    fingering: z.string().min(1).optional(),
    chordSymbol: z.string().optional(),
    graceNotes: z
      .array(
        z.object({
          pitch: pitchSchema,
          durationTicks: z.number(),
          slashed: z.boolean().optional(),
        })
      )
      .optional(),
    lyric: z
      .object({
        text: z.string(),
        syllabic: z.enum(['single', 'begin', 'middle', 'end']).optional(),
      })
      .optional(),
  })
  .strict();

export const restEventSchema = z
  .object({
    id: uuidSchema,
    startTick: z.number().int().nonnegative(),
    durationTicks: z.number().int().positive(),
    voiceId: uuidSchema,
    trackId: uuidSchema,
  })
  .strict();

export const musicalEventSchema = z.union([noteEventSchema, restEventSchema]);

export const voiceSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  events: z.array(musicalEventSchema),
});

export const measureSchema = z.object({
  id: uuidSchema,
  index: z.number().int().nonnegative(),
  startTick: z.number().int().nonnegative(),
  durationTicks: z.number().int().positive(),
  timeSignature: timeSignatureSchema,
  keySignature: keySignatureSchema,
  voices: z.array(voiceSchema),
  // Minimum 2, not 1: a count of one is not a multi-measure rest, and
  // rejecting it here stops a meaningless value reaching the renderer.
  multiMeasureRestCount: z.number().int().min(2).optional(),
  repeatStart: z.boolean().optional(),
  repeatEnd: z.boolean().optional(),
  // Positive whole numbers: an ending is "1." or "1, 2.", never a zeroth pass.
  endingNumbers: z.array(z.number().int().positive()).min(1).optional(),
  rehearsalMark: z.string().min(1).optional(),
  cue: z
    .object({ label: z.string().min(1), events: z.array(musicalEventSchema) })
    .optional(),
  clef: clefSchema.optional(),
  pickup: z.boolean().optional(),
  barline: barlineStyleSchema.optional(),
  segno: z.boolean().optional(),
  coda: z.boolean().optional(),
  toCoda: z.boolean().optional(),
  fine: z.boolean().optional(),
  jump: repeatJumpSchema.optional(),
});

export const trackSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  instrumentName: z.string(),
  midiProgram: z.number().int().min(0).max(127),
  midiChannel: z.number().int().min(0).max(15),
  clef: clefSchema,
  volume: z.number(),
  pan: z.number(),
  muted: z.boolean(),
  solo: z.boolean(),
  measures: z.array(measureSchema),
});

export const scoreMetadataSchema = z.object({
  title: z.string(),
  composer: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const scoreSchema = z.object({
  id: uuidSchema,
  version: z.number().int().nonnegative(),
  ppq: z.number().int().positive(),
  metadata: scoreMetadataSchema,
  tempoMap: z.array(tempoEventSchema),
  tracks: z.array(trackSchema),
});

/** Parses and validates untrusted JSON as a `Score`. Throws `ZodError` on invalid input. */
export function parseScore(json: unknown): Score {
  return scoreSchema.parse(json) as Score;
}

// ---------------------------------------------------------------------------
// 5. AI generation contracts
// ---------------------------------------------------------------------------

export type GenerateScoreRequestTrack = {
  name: string;
  instrumentName: string;
  midiProgram: number;
  clef: Track['clef'];
  range?: { lowestMidi: number; highestMidi: number };
  maximumPolyphony?: number;
};

export type GenerateScoreRequest = {
  prompt: string;
  title?: string;
  style?: string;
  mood?: string;
  durationMeasures: number;
  tempo?: number;
  timeSignature?: TimeSignature;
  keySignature?: KeySignature;
  tracks: GenerateScoreRequestTrack[];
  complexity?: 'simple' | 'moderate' | 'complex';
};

/** Never a rendered/notation payload and never raw MIDI: always a structured `Score`. */
export type GenerateScoreResult = { score: Score; warnings: string[] };

export type RegenerationConstraints = {
  /**
   * Absent for a region that does not sit on barlines (Replace Notes), where
   * "preserve the measure count" says nothing and only muddies the prompt.
   * Still never `false`: a regeneration that may add or drop measures is not
   * a thing this system asks for.
   */
  preserveMeasureCount?: true;
  preserveTimeSignatures: true;
  preserveTempoEvents: true;
  preserveBoundaryNotes?: boolean;
  preserveHarmony?: boolean;
  preserveRhythm?: boolean;
  preserveMelody?: boolean;
  maximumPolyphony?: number;
  allowedPitchRangeByTrack?: Record<string, { lowestMidi: number; highestMidi: number }>;
};

export type RegenerateRegionRequest = {
  scoreId: string;
  instruction: string;
  range: ScoreRange;
  precedingContext: ScoreFragment;
  selectedFragment: ScoreFragment;
  followingContext: ScoreFragment;
  constraints: RegenerationConstraints;
  candidateCount: number;
  /** Same three dials whole-score generation has; the prompt builder emits them identically. */
  style?: string;
  mood?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
};

export type RegenerationCandidate = { id: string; label: string; fragment: ScoreFragment };

export type RegenerateRegionResult = { candidates: RegenerationCandidate[]; warnings: string[] };

export interface MusicGenerationProvider {
  id: string;
  name: string;
  generateScore(request: GenerateScoreRequest, signal?: AbortSignal): Promise<GenerateScoreResult>;
  regenerateRegion(
    request: RegenerateRegionRequest,
    signal?: AbortSignal
  ): Promise<RegenerateRegionResult>;
}

// ---------------------------------------------------------------------------
// 6. Zod schemas for the generation contracts
// ---------------------------------------------------------------------------

export const midiRangeSchema = z.object({
  lowestMidi: z.number().int().min(0).max(127),
  highestMidi: z.number().int().min(0).max(127),
});

export const scoreRangeSchema = z.object({
  startTick: z.number().int().nonnegative(),
  endTick: z.number().int().nonnegative(),
  trackIds: z.array(z.string().min(1)),
});

export const scoreFragmentSchema = z.object({
  range: scoreRangeSchema,
  ppq: z.number().int().positive(),
  tracks: z.array(z.object({ trackId: z.string().min(1), measures: z.array(measureSchema) })),
});

export const generateScoreRequestTrackSchema = z.object({
  name: z.string(),
  instrumentName: z.string(),
  midiProgram: z.number().int().min(0).max(127),
  clef: clefSchema,
  range: midiRangeSchema.optional(),
  maximumPolyphony: z.number().int().positive().optional(),
});

export const generateScoreRequestSchema = z.object({
  prompt: z.string(),
  title: z.string().optional(),
  style: z.string().optional(),
  mood: z.string().optional(),
  durationMeasures: z.number().int().positive(),
  tempo: z.number().positive().optional(),
  timeSignature: timeSignatureSchema.optional(),
  keySignature: keySignatureSchema.optional(),
  tracks: z.array(generateScoreRequestTrackSchema),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
});

export const generateScoreResultSchema = z.object({
  score: scoreSchema,
  warnings: z.array(z.string()),
});

export const regenerationConstraintsSchema = z.object({
  preserveMeasureCount: z.literal(true).optional(),
  preserveTimeSignatures: z.literal(true),
  preserveTempoEvents: z.literal(true),
  preserveBoundaryNotes: z.boolean().optional(),
  preserveHarmony: z.boolean().optional(),
  preserveRhythm: z.boolean().optional(),
  preserveMelody: z.boolean().optional(),
  maximumPolyphony: z.number().int().positive().optional(),
  allowedPitchRangeByTrack: z.record(z.string(), midiRangeSchema).optional(),
});

export const regenerateRegionRequestSchema = z.object({
  scoreId: z.string().min(1),
  instruction: z.string(),
  range: scoreRangeSchema,
  precedingContext: scoreFragmentSchema,
  selectedFragment: scoreFragmentSchema,
  followingContext: scoreFragmentSchema,
  constraints: regenerationConstraintsSchema,
  candidateCount: z.number().int().positive(),
  style: z.string().optional(),
  mood: z.string().optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
});

export const regenerationCandidateSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  fragment: scoreFragmentSchema,
});

export const regenerateRegionResultSchema = z.object({
  candidates: z.array(regenerationCandidateSchema),
  warnings: z.array(z.string()),
});

/** Whether a project can be edited right now. Two states, because that is the only question the editor asks. */
/**
 * What currently owns a project.
 *
 * `generating` and `transcribing` both mean "a job is producing this project's
 * music, and writes must be refused until it lands" — they are distinct so the
 * editor can say which is happening, since one takes seconds of model time and
 * the other minutes of audio.
 */
export type ProjectStatus = 'ready' | 'generating' | 'transcribing';

export const projectStatusSchema = z.enum(['ready', 'generating', 'transcribing']);

/** Which of the five generation entry points produced a job. */
export type GenerationJobKind =
  | 'generate-score'
  | 'generate-track'
  | 'replace-notes'
  | 'replace-measures'
  | 'replace-track';

export const generationJobKindSchema = z.enum([
  'generate-score',
  'generate-track',
  'replace-notes',
  'replace-measures',
  'replace-track',
]);

/**
 * A job's own lifecycle, which is richer than its project's: `cancelled`
 * records that a result was produced and thrown away, which `ready` on the
 * project cannot express.
 */
/**
 * `queued` is a job waiting its turn: a user's generations run one at a time, so
 * a job accepted while another is running waits rather than being refused. Its
 * project is already `generating` — the request is built against the stored
 * score, so that score must not move underneath it while it waits.
 */
export type GenerationJobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export const generationJobStatusSchema = z.enum([
  'queued',
  'running',
  'done',
  'failed',
  'cancelled',
]);

/**
 * A job as reported to the client. The stored `request`/`result` payloads are
 * deliberately absent — they are large and the client never needs them.
 */
export type GenerationJob = {
  id: UUID;
  projectId: UUID;
  kind: GenerationJobKind;
  status: GenerationJobStatus;
  createdAt: string;
  finishedAt: string | null;
  error: string | null;
  /** Absent when the job never reached the model, or the stream reported no usage. */
  usage?: TokenUsage;
};

/**
 * What one generation job cost the provider.
 *
 * Lives here rather than in music_api because the client sees it: `GET /jobs/:id`
 * carries it, and the app has no other way to report what a generation used.
 *
 * There is deliberately no `totalTokens` — it is the sum of the other two, and a
 * stored derivable value is a chance for them to disagree. `model` is present
 * because tokens only become money per-model and the model is env-configurable,
 * so a total without it cannot be priced afterwards.
 */
export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  model: string;
};

export const tokenUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  model: z.string().min(1),
});

export const generationJobSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  kind: generationJobKindSchema,
  status: generationJobStatusSchema,
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
  error: z.string().nullable(),
  usage: tokenUsageSchema.optional(),
});

/**
 * `request` is the whole provider request, stored verbatim so the job never
 * re-reads the project. Its shape varies by `kind`, so it is unknown here and
 * narrowed by the runner.
 */
export type CreateGenerationJobRequest = {
  projectId: UUID;
  kind: GenerationJobKind;
  request: unknown;
};

export const createGenerationJobRequestSchema = z.object({
  projectId: z.string().min(1),
  kind: generationJobKindSchema,
  request: z.unknown(),
});

/** Parses and validates untrusted JSON as a `GenerateScoreRequest`. Throws `ZodError` on invalid input. */
export function parseGenerateScoreRequest(json: unknown): GenerateScoreRequest {
  return generateScoreRequestSchema.parse(json) as GenerateScoreRequest;
}

/** Parses and validates untrusted JSON as a `GenerateScoreResult`. Throws `ZodError` on invalid input. */
export function parseGenerateScoreResult(json: unknown): GenerateScoreResult {
  return generateScoreResultSchema.parse(json) as GenerateScoreResult;
}

/** Parses and validates untrusted JSON as a `RegenerateRegionRequest`. Throws `ZodError` on invalid input. */
export function parseRegenerateRegionRequest(json: unknown): RegenerateRegionRequest {
  return regenerateRegionRequestSchema.parse(json) as RegenerateRegionRequest;
}

/** Parses and validates untrusted JSON as a `RegenerateRegionResult`. Throws `ZodError` on invalid input. */
export function parseRegenerateRegionResult(json: unknown): RegenerateRegionResult {
  return regenerateRegionResultSchema.parse(json) as RegenerateRegionResult;
}

/** Parses and validates untrusted JSON as a `RegenerationCandidate`. Throws `ZodError` on invalid input. */
export function parseRegenerationCandidate(json: unknown): RegenerationCandidate {
  return regenerationCandidateSchema.parse(json) as RegenerationCandidate;
}

// ---------------------------------------------------------------------------
// 7. Project API types (music_api payloads)
// ---------------------------------------------------------------------------

export type ProjectUiPrefs = {
  zoom: number;
  /**
   * Track ids to draw. **Absent means every track is visible** — a project
   * saved before this field existed, or one that never hid anything, needs no
   * migration and no backfill. An empty array is not a valid value: a blank
   * page is never what anyone meant.
   *
   * Ids naming tracks that no longer exist are ignored on load rather than
   * treated as an error, so hiding a track, deleting it, and undoing the
   * deletion all behave.
   */
  visibleTrackIds?: string[];
};

/** Project list item — everything but the (potentially large) score payload. */
export type ProjectSummary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  /** Required, not optional: a project always has a status, and a missing one would read as editable. */
  status: ProjectStatus;
  /** Why the last generation failed, or null. Survives navigating away, which the job row does not. */
  lastGenerationError: string | null;
};

export type ProjectRecord = ProjectSummary & {
  score: Score;
  uiPrefs?: ProjectUiPrefs;
  /** Which snapshot the live work descends from, so a new one attaches there. */
  parentSnapshotId?: UUID | null;
};

/**
 * What a *write* to a project returns: everything but the score.
 *
 * A create or an autosave sends the score and gets the identical bytes back,
 * which no caller has ever read — the writer already holds the score it just
 * sent. On a debounced autosave that echo doubled the cost of every edit, so
 * reads return the score and writes return metadata about it.
 */
export type ProjectSaveResult = Omit<ProjectRecord, 'score'>;

/**
 * What a status poll returns. Deliberately small: an open editor asks for this
 * every few seconds for the whole session.
 *
 * `parentSnapshotId` rides along because it is the one other field an editor
 * needs while a project is open, and fetching the whole project to read it was
 * the alternative.
 */
/**
 * Who the caller is, from `GET /me`.
 *
 * Exists for `siteAdmin`. The server grants administrators free generation —
 * no quota, no balance check, no charge — and the client has to know, because
 * it does its own courtesy gating on the balance. Without it an administrator
 * is refused by their own UI on a request the server would have accepted.
 */
export type CurrentUser = {
  userId: string;
  email: string | null;
  siteAdmin: boolean;
};

export type ProjectStatusResult = {
  status: ProjectStatus;
  /**
   * A freshness signal, not a timestamp to display. A client compares it with
   * the one its own last write returned; a difference means the server's copy
   * moved under it and must be re-read.
   */
  updatedAt: string;
  lastGenerationError: string | null;
  parentSnapshotId: UUID | null;
};

/**
 * A project pinned at a moment, which never changes again.
 *
 * Holds its **own full copy** of the score rather than a delta: reconstructing
 * a version by replaying diffs is exactly the thing that quietly stops being
 * reproducible, and immutability is the whole point here.
 */
export type Snapshot = {
  id: UUID;
  projectId: UUID;
  /** The snapshot this one grew from. Null for the first in a project. */
  parentId: UUID | null;
  name: string;
  score: Score;
  uiPrefs?: ProjectUiPrefs;
  /**
   * Set when published; the public URL is /p/<publicId>. Absent when not.
   *
   * Publishing is metadata about *sharing*, not part of the music — which is
   * why it may change on a snapshot that otherwise never does.
   */
  publicId?: string;
  /** Shown on the Community list. Never the account email. */
  publisherName?: string;
  createdAt: string;
};

/** What an anonymous visitor receives. Carries no owner identity, by construction. */
export type PublishedSnapshot = {
  publicId: string;
  name: string;
  publisherName: string;
  score: Score;
  createdAt: string;
};

/** One row of the Community list. No score — the list would be enormous. */
export type CommunityItem = Omit<PublishedSnapshot, 'score'>;

/** A snapshot without its score — what the picker lists, so it stays cheap. */
export type SnapshotSummary = Omit<Snapshot, 'score' | 'uiPrefs'>;

export type ProjectCreateRequest = {
  name: string;
  score: Score;
  uiPrefs?: ProjectUiPrefs;
};

export type ProjectUpdateRequest = {
  name?: string;
  score?: Score;
  uiPrefs?: ProjectUiPrefs;
};

/**
 * Duplicating is a server-side copy: the score is read and written inside the
 * database and never crosses the wire in either direction.
 */
export type ProjectDuplicateRequest = {
  /** Defaults to "<original name> (copy)". */
  name?: string;
};

export type ProjectListQuery = {
  search?: string;
  sort?: 'updatedAt' | 'name';
};

// ---------------------------------------------------------------------------
// 8. Zod schemas for the project API
// ---------------------------------------------------------------------------

export const projectUiPrefsSchema = z.object({
  zoom: z.number().positive(),
  visibleTrackIds: z.array(z.string().min(1)).nonempty().optional(),
});

export const projectSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().int().nonnegative(),
});

export const projectSaveResultSchema = projectSummarySchema.extend({
  uiPrefs: projectUiPrefsSchema.optional(),
  /** Which snapshot the live work descends from, so a new one attaches there. */
  parentSnapshotId: z.string().min(1).nullable().optional(),
});

export const projectRecordSchema = projectSaveResultSchema.extend({
  score: scoreSchema,
});

export const snapshotSummarySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  // On the summary, not only the full snapshot: publishing state is what the
  // picker badges from, and it is also all a publish response needs to return.
  publicId: z.string().min(1).optional(),
  publisherName: z.string().min(1).optional(),
});

export const snapshotSchema = snapshotSummarySchema.extend({
  score: scoreSchema,
  uiPrefs: projectUiPrefsSchema.optional(),
});

/** What an anonymous visitor receives. Carries no owner identity, by construction. */
export const publishedSnapshotSchema = z.object({
  publicId: z.string().min(1),
  name: z.string().min(1),
  publisherName: z.string().min(1),
  score: scoreSchema,
  createdAt: z.string().min(1),
});

/** One row of the Community list. No score — the list would be enormous. */
export const communityItemSchema = publishedSnapshotSchema.omit({ score: true });

export const publishRequestSchema = z.object({
  publisherName: z.string().min(1).max(80),
});

export const snapshotCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
});

export const projectCreateRequestSchema = z.object({
  name: z.string().min(1),
  score: scoreSchema,
  uiPrefs: projectUiPrefsSchema.optional(),
});

export const projectUpdateRequestSchema = z.object({
  name: z.string().min(1).optional(),
  score: scoreSchema.optional(),
  uiPrefs: projectUiPrefsSchema.optional(),
});

/**
 * Duplicating is a server-side copy. The score never leaves the database, so
 * the request carries only the new name (absent = "<name> (copy)").
 */
export const projectDuplicateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export const projectListQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['updatedAt', 'name']).optional(),
});

// ---------------------------------------------------------------------------
// 9. Response envelope + error codes
// ---------------------------------------------------------------------------

export const API_ERROR_CODES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  AI_OUTPUT_INVALID: 'AI_OUTPUT_INVALID',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  /**
   * The project is owned by a running generation job and cannot be written.
   * Distinct from a generic failure so a client can tell "busy, try later"
   * from "something broke" — an autosave should quietly stand down, not
   * surface an error.
   */
  PROJECT_GENERATING: 'PROJECT_GENERATING',
  /**
   * No transcription service is configured on this deployment.
   *
   * Distinct from a failure so the client can say "this server cannot
   * transcribe audio" and hide the option, rather than reporting a breakage.
   */
  TRANSCRIPTION_UNAVAILABLE: 'TRANSCRIPTION_UNAVAILABLE',
  /**
   * The user has no credits left. Distinct from a quota refusal: a quota is a
   * rate limit that lifts on its own, and this does not — it lifts when the
   * user buys more, which is a different thing to tell them.
   */
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: ApiErrorCode;
};

/** Wraps payload data in the standard success envelope. */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/** Wraps an error message (and optional typed code) in the standard error envelope. */
export function errorResponse(message: string, code?: ApiErrorCode): ApiResponse<never> {
  return code ? { success: false, error: message, code } : { success: false, error: message };
}

// ---------------------------------------------------------------------------
// 10. Platform interfaces (implementations live in @sudobility/music_io)
// ---------------------------------------------------------------------------
export * from './platform/index.js';

// ---------------------------------------------------------------------------
// 10. Pure domain primitives (shared by frontend and backend)
// ---------------------------------------------------------------------------

export * from './domain/pitch/pitch.js';
export * from './domain/pitch/transpose.js';
export * from './domain/quantization/options.js';
export * from './domain/quantization/quantize.js';
export * from './domain/score/factory.js';
export * from './domain/score/fragment.js';
export * from './domain/score/ids.js';
export * from './domain/score/queries.js';
export * from './domain/score/ties.js';
export * from './domain/selection/types.js';
export * from './domain/time/durations.js';
export * from './domain/time/fraction.js';
export * from './domain/time/tempo-map.js';
export * from './domain/time/ticks.js';
export * from './domain/voicing/allocate.js';
export * from './domain/validation/issues.js';
export * from './domain/validation/validator.js';

// ---------------------------------------------------------------------------
// 11. Score commands (pure Score -> Score transformations, shared by both sides)
// ---------------------------------------------------------------------------

export * from './domain/commands/types.js';
export * from './domain/commands/reflow.js';
export * from './domain/commands/snapshot.js';
export * from './domain/commands/structure-commands.js';
export * from './domain/commands/track-commands.js';
export * from './domain/commands/region-commands.js';
export * from './domain/commands/note-commands.js';
export * from './domain/commands/edit-commands.js';
export * from './domain/commands/relocate-commands.js';
export * from './domain/commands/ripple-commands.js';
export * from './domain/instruments/gm.js';
export * from './domain/instruments/gm-kit.js';
export * from './domain/instruments/gm-range.js';
export * from './domain/instruments/gm-polyphony.js';
export * from './domain/instruments/gm-transposition.js';
export * from './domain/instruments/gm-percussion.js';
export * from './domain/selection/selection.js';
export * from './services/regeneration/controller.js';
