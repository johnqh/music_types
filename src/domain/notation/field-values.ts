/**
 * What a property field does with what it is given.
 *
 * Every inspector field in both apps takes a draft string, turns it into a
 * number, bounds it and writes it — and each app had written those steps
 * inline, per field, per panel. They disagreed in small ways nobody chose: the
 * web rounded a typed tempo and the native panel did not, the native octave
 * field clamped to -1..9 and the web one did not clamp at all, and the pickup
 * list was built from the same arithmetic in two files. The rules are facts
 * about the fields rather than about either panel, so they are stated once.
 *
 * No hooks, no strings a translator would touch — each function takes a value
 * and answers with a value or a key-free structure the app labels itself.
 */
import type {
  DurationName,
  Measure,
  Score,
  TempoEvent,
} from "../../index";
import { DEFAULT_BPM } from "../score/defaults";
import { commonValue } from "../score/common-value";
import { beatDurationTicks, durationNameForTicks } from "../time/ticks";
import { MAX_BPM, MIN_BPM } from "../validation/limits";
import { NO_PICKUP } from "./picker-options";

// ---- numbers from drafts ---------------------------------------------------

/** Bounds for `parseNumericDraft`; every one is optional. */
export type NumericDraftOptions = {
  min?: number;
  max?: number;
  /** Round to a whole number before bounding. */
  integer?: boolean;
};

/**
 * A draft field's text as a number, or `null` when there is nothing to commit.
 *
 * Blank is `null` rather than 0: a field emptied and left is "no change", and
 * `Number("")` being 0 is how an emptied velocity field used to write silence.
 * Out-of-range input is clamped rather than refused, because a typed "200" in
 * a 0-127 field means "as loud as it goes".
 */
export function parseNumericDraft(
  text: string,
  options: NumericDraftOptions = {},
): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  let value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  if (options.integer) value = Math.round(value);
  if (options.min !== undefined) value = Math.max(options.min, value);
  if (options.max !== undefined) value = Math.min(options.max, value);
  return value;
}

/**
 * A tempo as it may be stored: whole, and inside the validator's bounds.
 *
 * Whole because a tempo the transport rounds for display but stores
 * unrounded reads back differently the next time the field is opened. A
 * non-number gives the default tempo; callers parse with `parseNumericDraft`
 * first and should never get here with one.
 */
export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

// ---- bar fields ------------------------------------------------------------

/**
 * The tempo at a bar, and whether the bar itself sets it.
 *
 * `bpm` is the tempo **in force** — the last event at or before the bar's
 * start — so the field is never blank and never lies; unrounded, since the
 * display rounds and the commit clamps. `ownEventId` names the event this bar
 * sets, which is the only one a Remove control may offer to delete.
 * `isStarting` is true when that event is the score's first (earliest-tick)
 * one: the opening tempo is not a *change*, and removing it would leave the
 * score with no tempo at all.
 */
export type BarTempo = {
  bpm: number;
  ownEventId: string | null;
  isStarting: boolean;
};

export function tempoAtBar(score: Score, measure: Measure): BarTempo {
  const sorted: TempoEvent[] = [...score.tempoMap].sort(
    (a, b) => a.tick - b.tick,
  );
  let inForce: TempoEvent | undefined;
  for (const event of sorted) {
    if (event.tick <= measure.startTick) inForce = event;
  }
  const own = sorted.find((event) => event.tick === measure.startTick);
  return {
    bpm: inForce?.bpm ?? DEFAULT_BPM,
    ownEventId: own?.id ?? null,
    isStarting: own !== undefined && sorted[0]?.id === own.id,
  };
}

/**
 * The pickup picker's current value and the lengths it offers, in beats.
 *
 * Beats because "a one-beat pickup" is how a musician says it; the ticks
 * follow from the time signature, so compound time counts dotted beats. The
 * list stops one beat short of the bar — a pickup as long as the bar is just a
 * bar — but always offers at least one beat.
 */
export function pickupBeatOptions(
  measure: Measure,
  ppq: number,
): { current: string; beats: number[] } {
  const beatTicks = beatDurationTicks(measure.timeSignature, ppq);
  const fullBeats = Math.max(1, Math.round(measure.durationTicks / beatTicks));
  return {
    current: measure.pickup
      ? String(Math.round(measure.durationTicks / beatTicks))
      : NO_PICKUP,
    beats: Array.from({ length: Math.max(1, fullBeats - 1) }, (_, i) => i + 1),
  };
}

/**
 * A volta's pass numbers from what was typed: `"1, 2"` is a bar played on both
 * passes. Anything that is not a positive whole number is dropped rather than
 * refused — an unparseable entry clears the bracket instead of storing one
 * nobody asked for.
 */
export function parseEndingNumbers(text: string): number[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
}

/** The inverse of `parseEndingNumbers`, for seeding the field. */
export function formatEndingNumbers(
  numbers: readonly number[] | undefined,
): string {
  return (numbers ?? []).join(", ");
}

// ---- note fields -----------------------------------------------------------

/**
 * What the duration picker shows for a selection.
 *
 * Three states and not two, which is what the native panel got wrong: a
 * selection whose notes agree on a length no notehead spells is one *custom*
 * length, not a *mixed* selection, and the two read differently. `null` for
 * an empty selection, which shows no field.
 */
export type DurationFieldState =
  | { kind: "name"; name: DurationName; ticks: number }
  | { kind: "custom"; ticks: number }
  | { kind: "mixed" };

export function durationFieldState(
  notes: ReadonlyArray<{ durationTicks: number }>,
  ppq: number,
): DurationFieldState | null {
  if (notes.length === 0) return null;
  const ticks = commonValue(notes.map((note) => note.durationTicks));
  if (ticks === null) return { kind: "mixed" };
  const name = durationNameForTicks(ticks, ppq);
  return name ? { kind: "name", name, ticks } : { kind: "custom", ticks };
}

/**
 * A beat for an editable position field: at most two decimals, none on a whole
 * beat. A swung eighth is beat 2.5 and must stay stateable exactly; a triplet
 * is 1.33 rather than 1.3333333333333333, which read as noise.
 */
export function formatBeatForField(beat: number): string {
  return String(Math.round(beat * 100) / 100);
}

// ---- mixing ----------------------------------------------------------------

/**
 * The resolution a mixer control moves in.
 *
 * Both sliders already stepped by 0.01; a value committed off-grid — from a
 * drag's float arithmetic — was stored as 0.07000000001 and round-tripped
 * through the project that way.
 */
export const MIX_STEP = 0.01;

/** A value snapped onto `MIX_STEP`, without float noise. */
export function quantizeMix(value: number): number {
  const steps = Math.round(1 / MIX_STEP);
  return Math.round(value * steps) / steps;
}

/** A track volume inside 0-1. A non-number is silence, never full level. */
export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** A pan position inside -1..1. A non-number is the centre. */
export function clampPan(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(-1, value));
}
