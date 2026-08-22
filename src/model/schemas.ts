/**
 * Zod schemas for the score tree.
 *
 * Kept beside the types rather than merged into them: these are the *runtime*
 * contract — the velocity range, the tick bounds, which fields are optional —
 * and they are what a payload crossing the wire is checked against.
 */
import { z } from "zod";
import type { Score } from "./score.js";
// ---------------------------------------------------------------------------
// 4. Zod schemas for the score tree
// ---------------------------------------------------------------------------
// Runtime constraints: velocity 0-127, midiProgram 0-127, midiChannel 0-15,
// ppq positive int, accidental -2..2, octave -1..9. `noteEventSchema` /
// `restEventSchema` are `.strict()` so an object with a stray `pitch` field
// cannot be silently accepted as a rest (and vice versa); every other schema
// stays permissive to tolerate forward-compatible additions.

export const uuidSchema = z.string().min(1);

export const pitchStepSchema = z.enum(["C", "D", "E", "F", "G", "A", "B"]);

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
  mode: z.enum(["major", "minor"]),
});

export const tempoEventSchema = z.object({
  id: uuidSchema,
  tick: z.number().int().nonnegative(),
  bpm: z.number().positive(),
});

export const articulationSchema = z.enum([
  "staccato",
  "accent",
  "tenuto",
  "marcato",
]);
export const hairpinSchema = z.enum(["crescendo", "diminuendo"]);
export const ottavaSchema = z.enum(["8va", "8vb", "15ma", "15mb"]);
export const barlineStyleSchema = z.enum(["double", "final"]);
export const repeatJumpSchema = z.enum([
  "da-capo",
  "da-capo-al-fine",
  "da-capo-al-coda",
  "dal-segno",
  "dal-segno-al-fine",
  "dal-segno-al-coda",
]);
export const ornamentSchema = z.enum([
  "trill",
  "mordent",
  "inverted-mordent",
  "turn",
]);
export const dynamicSchema = z.enum([
  "ppp",
  "pp",
  "p",
  "mp",
  "mf",
  "f",
  "ff",
  "fff",
]);

export const clefSchema = z.enum([
  "treble",
  "bass",
  "alto",
  "tenor",
  "percussion",
]);

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
    beam: z.enum(["break", "none"]).optional(),
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
        }),
      )
      .optional(),
    lyric: z
      .object({
        text: z.string(),
        syllabic: z.enum(["single", "begin", "middle", "end"]).optional(),
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
