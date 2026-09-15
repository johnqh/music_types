/**
 * The numeric bounds every validation rule is written against.
 *
 * Extracted so `validator.ts` and `repair.ts` cannot drift: a repair that
 * clamped to its own idea of "valid" would hand back a score the validator
 * still rejects, and the Fix button would appear to do nothing. One
 * definition means a clamp to these bounds provably clears the rule that
 * cited them.
 */
export const MIN_MIDI = 0;
export const MAX_MIDI = 127;
/**
 * The octaves MIDI 0 (C-1) and 127 (G9) fall in — the bounds an octave field
 * clamps to. Scientific pitch numbering, so middle C is octave 4. An octave
 * inside the bounds can still name a note past 127 (G#9 and up); the pitch
 * command refuses those, this only keeps the field's range honest.
 */
export const MIN_OCTAVE = -1;
export const MAX_OCTAVE = 9;
export const MIN_VELOCITY = 0;
export const MAX_VELOCITY = 127;
export const MIN_MIDI_PROGRAM = 0;
export const MAX_MIDI_PROGRAM = 127;
export const MIN_MIDI_CHANNEL = 0;
export const MAX_MIDI_CHANNEL = 15;
/**
 * The denominators a time signature may have, in the order a picker offers
 * them. `VALID_TIME_SIG_DENOMINATORS` is built from this list rather than
 * restating it, so the picker cannot offer a meter the validator rejects.
 */
export const TIME_SIG_DENOMINATOR_OPTIONS = [1, 2, 4, 8, 16, 32] as const;
export const VALID_TIME_SIG_DENOMINATORS = new Set<number>(
  TIME_SIG_DENOMINATOR_OPTIONS,
);
/**
 * The largest numerator a meter field accepts.
 *
 * Not a validation rule — the schema takes any positive integer, and an
 * imported 64/16 is still a score — but the bound an *entry* field clamps to.
 * 32 is what the native inspector already capped at; nothing real is longer.
 */
export const MAX_TIME_SIG_NUMERATOR = 32;
export const MIN_FIFTHS = -7;
export const MAX_FIFTHS = 7;
export const MIN_BPM = 20;
export const MAX_BPM = 400;

/**
 * Maximum number of notes sounding at once (within a single track) before a
 * "too many simultaneous notes" readability warning fires. Spec §23 names
 * this rule but doesn't give a number; 10 is a deliberate implementer
 * default (roughly as many notes as a two-hand piano voicing on one staff
 * can render legibly), documented here so a later task can make it
 * configurable if that turns out to be too strict/loose in practice.
 */
export const MAX_SIMULTANEOUS_NOTES = 10;
