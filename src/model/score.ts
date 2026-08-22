/**
 * The score model: what a piece of music *is* in this system.
 *
 * Split out of `index.ts`, which had grown to 1,463 lines holding the whole
 * model, every Zod schema and every API payload in one scroll. The index is
 * now purely re-exports, so `@sudobility/music_types` still presents one
 * surface while the declarations are findable.
 */
// ---------------------------------------------------------------------------
// 1. Score model types
// ---------------------------------------------------------------------------

export type UUID = string;

export type Fraction = { numerator: number; denominator: number };

export type PitchStep = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** -2 = double flat, -1 = flat, 0 = natural, 1 = sharp, 2 = double sharp. */
export type Accidental = -2 | -1 | 0 | 1 | 2;

export type Pitch = { step: PitchStep; accidental: Accidental; octave: number };

export type TimeSignature = { numerator: number; denominator: number };

export type KeySignature = { fifths: number; mode: "major" | "minor" };

export type TempoEvent = { id: UUID; tick: number; bpm: number };

/**
 * Renderable note-duration names: base values (whole down to thirty-second),
 * their dotted (1.5x) variants, and their triplet (2/3x) variants.
 */
export type DurationName =
  | "whole"
  | "half"
  | "quarter"
  | "eighth"
  | "sixteenth"
  | "thirtysecond"
  | "dotted-whole"
  | "dotted-half"
  | "dotted-quarter"
  | "dotted-eighth"
  | "dotted-sixteenth"
  | "dotted-thirtysecond"
  | "triplet-whole"
  | "triplet-half"
  | "triplet-quarter"
  | "triplet-eighth"
  | "triplet-sixteenth"
  | "triplet-thirtysecond";

export type Articulation = "staccato" | "accent" | "tenuto" | "marcato";

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
export type Ornament = "trill" | "mordent" | "inverted-mordent" | "turn";

/**
 * A gradual change of loudness, written as a wedge under the stave.
 *
 * The other half of `Dynamic`: a dynamic is a *level* that holds until the
 * next one, and a hairpin is the *change* between two of them. Most dynamic
 * writing is hairpins, so a score that had only levels could say "loud here"
 * but never "get louder".
 */
export type Hairpin = "crescendo" | "diminuendo";

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
export type Ottava = "8va" | "8vb" | "15ma" | "15mb";

/**
 * The line drawn at the end of a bar, where it is not an ordinary single one.
 *
 * Only the two that carry meaning a reader acts on: `double` marks a section
 * break, and `final` ends the piece. The repeat barlines are deliberately not
 * in here — they live on `repeatStart`/`repeatEnd` because they are two
 * independent flags rather than one choice, and a bar can both end a repeat
 * and end the piece.
 */
export type BarlineStyle = "double" | "final";

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
  | "da-capo"
  | "da-capo-al-fine"
  | "da-capo-al-coda"
  | "dal-segno"
  | "dal-segno-al-fine"
  | "dal-segno-al-coda";

/**
 * A dynamic marking, from softest to loudest.
 *
 * Attached to the note it applies *from*, and in force until the next one on
 * that track — which is how a dynamic is read on paper and how it is played.
 * Stored as the marking rather than as a velocity, because "mf" is what the
 * score says; the velocity a player gives it is derived (`velocityForDynamic`
 * in music_lib) and stays adjustable per note on top.
 */
export type Dynamic = "ppp" | "pp" | "p" | "mp" | "mf" | "f" | "ff" | "fff";

/**
 * How a sung syllable joins its neighbours.
 *
 * MusicXML's own vocabulary, kept rather than invented: it is what decides
 * whether a hyphen is drawn to the next note. "beau-ti-ful" over three notes
 * is `begin`, `middle`, `end`; a one-syllable word is `single`.
 */
export type Syllabic = "single" | "begin" | "middle" | "end";

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
  "ppp",
  "pp",
  "p",
  "mp",
  "mf",
  "f",
  "ff",
  "fff",
] as const;

export type Clef = "treble" | "bass" | "alto" | "tenor" | "percussion";

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
  return "pitch" in event;
}

/** True for `RestEvent`s (distinguished from `NoteEvent` by lacking a `pitch` property). */
export function isRestEvent(event: MusicalEvent): event is RestEvent {
  return !("pitch" in event);
}

// ---------------------------------------------------------------------------
// 3. Selection / fragment types
// ---------------------------------------------------------------------------

/** A tick range scoped to a set of tracks (e.g. a loop region or regeneration target). */
export type ScoreRange = {
  startTick: number;
  endTick: number;
  trackIds: string[];
};

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
