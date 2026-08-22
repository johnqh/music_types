/**
 * Every field the model carries must survive its own schema.
 *
 * `measureSchema` is a plain `z.object`, and zod **strips** keys it does not
 * know. So a field added to the `Measure` type but forgotten in the schema
 * typechecks everywhere, renders, exports, round-trips through MusicXML — and
 * then vanishes the moment a score is parsed. That is exactly what happened to
 * `clef` and `pickup`: both shipped, and both were silently dropped by
 * `measureSchema.parse`.
 *
 * Nothing else catches it. The type and the schema are written by hand and
 * never compared, and no test parsed a measure that carried the new fields.
 * So these build one object carrying *every* optional field and assert it
 * comes back whole.
 */
import { describe, expect, it } from 'vitest';
import { measureSchema, noteEventSchema, restEventSchema } from './index.js';
import type { Measure, NoteEvent, RestEvent } from './index.js';

/** A measure carrying every field a `Measure` can have. */
const FULL_MEASURE: Measure = {
  id: 'm0',
  index: 0,
  startTick: 0,
  durationTicks: 1920,
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: { fifths: 0, mode: 'major' },
  voices: [],
  multiMeasureRestCount: 4,
  rehearsalMark: 'B',
  cue: { label: 'Fl.', events: [] },
  repeatStart: true,
  repeatEnd: true,
  endingNumbers: [1, 2],
  clef: 'bass',
  pickup: true,
  barline: 'final',
  segno: true,
  coda: true,
  toCoda: true,
  fine: true,
  jump: 'dal-segno-al-coda',
};

/** A note carrying every field a `NoteEvent` can have. */
const FULL_NOTE: NoteEvent = {
  id: 'n0',
  pitch: { step: 'C', accidental: 1, octave: 4 },
  startTick: 0,
  durationTicks: 480,
  velocity: 80,
  voiceId: 'v0',
  trackId: 't0',
  tieStart: true,
  tieStop: true,
  articulation: 'staccato',
  fermata: true,
  ornament: 'trill',
  dynamic: 'ff',
  slurStart: true,
  slurStop: true,
  hairpinStart: 'crescendo',
  hairpinStop: true,
  arpeggiate: true,
  ottavaStart: '8va',
  ottavaStop: true,
  glissandoStart: true,
  glissandoStop: true,
  fingering: '3',
  lyric: { text: 'la', syllabic: 'begin' },
  graceNotes: [
    { pitch: { step: 'D', accidental: 0, octave: 4 }, durationTicks: 120, slashed: true },
  ],
  chordSymbol: 'Cmaj7',
};

const FULL_REST: RestEvent = {
  id: 'r0',
  startTick: 0,
  durationTicks: 480,
  voiceId: 'v0',
  trackId: 't0',
};

describe('schema completeness', () => {
  it('keeps every field of a fully-populated measure', () => {
    expect(measureSchema.parse(FULL_MEASURE)).toEqual(FULL_MEASURE);
  });

  it('keeps every field of a fully-populated note', () => {
    expect(noteEventSchema.parse(FULL_NOTE)).toEqual(FULL_NOTE);
  });

  it('keeps every field of a rest', () => {
    expect(restEventSchema.parse(FULL_REST)).toEqual(FULL_REST);
  });

  it('names the fields that would be dropped, rather than just failing', () => {
    // The failure mode this guards is silent, so when it does fire the message
    // has to say which key went missing.
    const parsed = measureSchema.parse(FULL_MEASURE) as Record<string, unknown>;
    const dropped = Object.keys(FULL_MEASURE).filter(key => !(key in parsed));
    expect(
      dropped,
      'Measure fields missing from measureSchema — zod strips unknown keys, ' +
        'so these vanish whenever a score is parsed',
    ).toEqual([]);
  });
});
