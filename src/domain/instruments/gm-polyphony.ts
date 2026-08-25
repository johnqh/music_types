/**
 * How many notes a General MIDI program can sound at once.
 *
 * General MIDI says nothing about this, so the numbers are ours. They are
 * physical facts about the instruments rather than preferences: a trumpet
 * player has one airstream, a guitar has six strings, a banjo five, a violinist
 * can bow two at once (and briefly break three).
 *
 * They live in `gm-catalogue.ts`, one row per program, alongside that
 * program's range and transposition — see that module for why a family default
 * plus overrides turned out to be the wrong shape for this.
 *
 * This exists so the editor can refuse to write a chord nobody could play. It
 * deliberately does NOT describe what a synthesizer patch can do — polyphony
 * there is a setting, not a limit — so every synth family is unlimited.
 */
import { gmSpec } from "./gm-catalogue.js";

/** No physical limit: keyboards, plucked strings, sections, synths, drums. */
export const UNLIMITED_POLYPHONY = Number.POSITIVE_INFINITY;

/**
 * The most notes `program` can sound simultaneously.
 *
 * `UNLIMITED_POLYPHONY` for anything chordal and for any program outside
 * 0-127: an unknown instrument gets the benefit of the doubt rather than
 * having edits blocked against a guess.
 */
export function gmMaxPolyphony(program: number): number {
  return gmSpec(program)?.maxPolyphony ?? UNLIMITED_POLYPHONY;
}

/** Whether `program` can sound `count` notes at once. */
export function gmSupportsChord(program: number, count: number): boolean {
  return count <= gmMaxPolyphony(program);
}
