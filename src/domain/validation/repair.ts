/**
 * Automatic repair for the rules `validateScore` checks (`./validator.ts`).
 *
 * The validator's inverse, and deliberately its neighbour: a repair that
 * clamped to its own idea of "valid" would hand back a score the validator
 * still rejects, so both read their bounds from `./limits.ts` and this module
 * *measures* its own result rather than asserting it — `repairScore`
 * re-validates at the end and reports the before/after counts per code. That
 * is what makes "Fix" honest about the issues it could not resolve instead of
 * quietly claiming all of them.
 *
 * Pure: never mutates its input, and returns a fresh `Score`.
 *
 * Each pass repairs toward what the notation *means*, not toward whatever
 * silences the rule fastest:
 *
 * - Two same-pitch notes that overlap are one note struck twice, so the
 *   earlier one is truncated to end where the later begins. An exact
 *   duplicate — same tick, same length, same spelling — cannot be played
 *   twice at once and is simply dropped.
 * - A pitch out of MIDI range moves by whole **octaves**, keeping its pitch
 *   class, for the reason the tracker exporter does it: a bassline pushed to
 *   the boundary stops being that bassline.
 * - A misordered measure is moved by shifting its events with it, because an
 *   event's `startTick` is absolute; rewriting the measure's own start alone
 *   would strand every note it contains outside it.
 * - The count of notes sounding at once is left alone. There is no
 *   non-arbitrary choice of which note to delete, and it is a readability
 *   warning rather than a broken score.
 */
import type {
  Measure,
  MusicalEvent,
  Pitch,
  Score,
  TempoEvent,
  Track,
  Voice,
} from "../../index.js";
import { isNoteEvent } from "../../index.js";
import { pitchToMidi } from "../pitch/pitch.js";
import { ISSUE_CODES } from "./issues.js";
import type { ValidationIssue } from "./issues.js";
import {
  MAX_BPM,
  MAX_FIFTHS,
  MAX_MIDI,
  MAX_MIDI_CHANNEL,
  MAX_MIDI_PROGRAM,
  MAX_VELOCITY,
  MIN_BPM,
  MIN_FIFTHS,
  MIN_MIDI,
  MIN_MIDI_CHANNEL,
  MIN_MIDI_PROGRAM,
  MIN_VELOCITY,
  VALID_TIME_SIG_DENOMINATORS,
} from "./limits.js";
import { validateScore } from "./validator.js";

export type ScoreRepair = {
  /** The repaired score. Identical by reference to the input when nothing needed fixing. */
  score: Score;
  /** How many issues of each code the repair actually cleared, measured by re-validating. */
  fixed: Record<string, number>;
  /** What the repaired score still reports, by code — the rules this cannot resolve. */
  remaining: Record<string, number>;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const countByCode = (
  issues: readonly ValidationIssue[],
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const issue of issues)
    counts[issue.code] = (counts[issue.code] ?? 0) + 1;
  return counts;
};

/** A spelling key, matching the validator's `samePitch` exactly: spelling, not sounding pitch. */
const spellingKey = (pitch: Pitch): string =>
  `${pitch.step}|${pitch.accidental}|${pitch.octave}`;

/** A fresh id that no other object in the score is already using. */
function freshId(taken: Set<string>, base: string): string {
  let candidate = `${base}-fix`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-fix${n}`;
    n += 1;
  }
  taken.add(candidate);
  return candidate;
}

/**
 * Every id made unique, walking in `checkUniqueIds`' own order so the *first*
 * use of an id keeps it and later ones are renamed. Renaming a track or voice
 * would strand the events pointing at it, which is why `repairEvents` rewrites
 * those references from the owner afterwards rather than from the old value.
 */
function repairIds(score: Score): Score {
  const taken = new Set<string>();
  const claim = (id: string): string => {
    if (!taken.has(id)) {
      taken.add(id);
      return id;
    }
    return freshId(taken, id);
  };

  const id = claim(score.id);
  const tempoMap = score.tempoMap.map((event) => ({
    ...event,
    id: claim(event.id),
  }));
  const tracks = score.tracks.map((track) => ({
    ...track,
    id: claim(track.id),
    measures: track.measures.map((measure) => ({
      ...measure,
      id: claim(measure.id),
      voices: measure.voices.map((voice) => ({
        ...voice,
        id: claim(voice.id),
        events: voice.events.map((event) => ({
          ...event,
          id: claim(event.id),
        })),
      })),
    })),
  }));
  return { ...score, id, tempoMap, tracks };
}

/** Programs and channels clamped into range. */
function repairTrackHeader(track: Track): Track {
  return {
    ...track,
    midiProgram: clamp(track.midiProgram, MIN_MIDI_PROGRAM, MAX_MIDI_PROGRAM),
    midiChannel: clamp(track.midiChannel, MIN_MIDI_CHANNEL, MAX_MIDI_CHANNEL),
  };
}

/** Time and key signatures brought into range; the denominator falls back to 4. */
function repairSignatures(measure: Measure): Measure {
  const { timeSignature, keySignature } = measure;
  return {
    ...measure,
    timeSignature: {
      numerator: Math.max(1, Math.round(timeSignature.numerator)),
      denominator: VALID_TIME_SIG_DENOMINATORS.has(timeSignature.denominator)
        ? timeSignature.denominator
        : 4,
    },
    keySignature: {
      ...keySignature,
      fifths: clamp(keySignature.fifths, MIN_FIFTHS, MAX_FIFTHS),
    },
  };
}

/** A pitch moved into MIDI range by whole octaves, so its pitch class survives. */
function repairPitch(pitch: Pitch): Pitch {
  let octave = pitch.octave;
  let midi = pitchToMidi({ ...pitch, octave });
  while (midi < MIN_MIDI && octave < 12) {
    octave += 1;
    midi = pitchToMidi({ ...pitch, octave });
  }
  while (midi > MAX_MIDI && octave > -2) {
    octave -= 1;
    midi = pitchToMidi({ ...pitch, octave });
  }
  return octave === pitch.octave ? pitch : { ...pitch, octave };
}

/**
 * One voice's events, each brought inside its measure and its own limits.
 *
 * An event whose length survives none of that is dropped rather than kept at
 * zero: a note of no duration is not something a reader or a player can act
 * on, and leaving it would only re-report as a non-positive duration.
 */
function repairEvents(
  events: readonly MusicalEvent[],
  measure: Measure,
  track: Track,
  voice: Voice,
): MusicalEvent[] {
  const measureEnd = measure.startTick + measure.durationTicks;
  const repaired: MusicalEvent[] = [];
  for (const event of events) {
    const startTick = clamp(
      event.startTick,
      measure.startTick,
      Math.max(measure.startTick, measureEnd - 1),
    );
    const durationTicks = Math.min(event.durationTicks, measureEnd - startTick);
    if (durationTicks <= 0) continue;
    const base = {
      ...event,
      startTick,
      durationTicks,
      trackId: track.id,
      voiceId: voice.id,
    };
    repaired.push(
      isNoteEvent(base)
        ? {
            ...base,
            velocity: clamp(base.velocity, MIN_VELOCITY, MAX_VELOCITY),
            pitch: repairPitch(base.pitch),
          }
        : base,
    );
  }
  return repaired;
}

/**
 * Same-pitch overlaps resolved within one voice.
 *
 * Grouped by spelling because that is what the rule compares — two notes an
 * enharmonic apart are different notes to it, and "fixing" them would edit
 * music the validator never complained about.
 */
function repairOverlaps(events: readonly MusicalEvent[]): MusicalEvent[] {
  const notes = events.filter(isNoteEvent);
  if (notes.length < 2) return [...events];

  const dropped = new Set<string>();
  /** id -> its new, truncated length. */
  const shortened = new Map<string, number>();
  const bySpelling = new Map<string, typeof notes>();
  for (const note of notes) {
    const key = spellingKey(note.pitch);
    const group = bySpelling.get(key);
    if (group) group.push(note);
    else bySpelling.set(key, [note]);
  }

  for (const group of bySpelling.values()) {
    const ordered = [...group].sort(
      (a, b) => a.startTick - b.startTick || a.durationTicks - b.durationTicks,
    );
    let previous: (typeof ordered)[number] | null = null;
    for (const note of ordered) {
      if (!previous) {
        previous = note;
        continue;
      }
      const previousLength =
        shortened.get(previous.id) ?? previous.durationTicks;
      const previousEnd = previous.startTick + previousLength;
      if (note.startTick >= previousEnd) {
        previous = note;
        continue;
      }
      // A note that begins where the last one did, for as long, is the same
      // strike written twice: there is nothing to shorten it to.
      if (
        note.startTick === previous.startTick &&
        note.durationTicks === previousLength
      ) {
        dropped.add(note.id);
        continue;
      }
      const trimmed = note.startTick - previous.startTick;
      if (trimmed <= 0) dropped.add(previous.id);
      else shortened.set(previous.id, trimmed);
      previous = note;
    }
  }

  if (dropped.size === 0 && shortened.size === 0) return [...events];
  return events
    .filter((event) => !dropped.has(event.id))
    .map((event) => {
      const length = shortened.get(event.id);
      return length === undefined ? event : { ...event, durationTicks: length };
    });
}

/** Merged, sorted spans of what a voice's events actually cover. */
function coveredSpans(
  events: readonly MusicalEvent[],
): Array<[number, number]> {
  const spans = events
    .map((event): [number, number] => [
      event.startTick,
      event.startTick + event.durationTicks,
    ])
    .sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [start, end] of spans) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

/**
 * Rests written into whatever the voice leaves uncovered.
 *
 * A bar that does not add up renders short, so the gap has to become something
 * — and a rest is what a reader expects to see where nothing sounds.
 */
function fillGaps(
  events: readonly MusicalEvent[],
  measure: Measure,
  track: Track,
  voice: Voice,
  taken: Set<string>,
): MusicalEvent[] {
  const measureEnd = measure.startTick + measure.durationTicks;
  const filled = [...events];
  let cursor = measure.startTick;
  for (const [start, end] of coveredSpans(events)) {
    if (start > cursor)
      filled.push({
        id: freshId(taken, `${voice.id}-rest-${cursor}`),
        startTick: cursor,
        durationTicks: start - cursor,
        trackId: track.id,
        voiceId: voice.id,
      });
    cursor = Math.max(cursor, end);
  }
  if (cursor < measureEnd)
    filled.push({
      id: freshId(taken, `${voice.id}-rest-${cursor}`),
      startTick: cursor,
      durationTicks: measureEnd - cursor,
      trackId: track.id,
      voiceId: voice.id,
    });
  return filled.sort((a, b) => a.startTick - b.startTick);
}

/**
 * Measures made contiguous and sequentially indexed.
 *
 * The events move with their measure. An event's `startTick` is absolute, so
 * correcting a measure's start without shifting its contents would push every
 * note it holds outside it and trade one issue for a bar's worth of others.
 */
function repairMeasureOrdering(track: Track): Track {
  let expected = 0;
  const measures = track.measures.map((measure, index) => {
    const delta = expected - measure.startTick;
    expected += measure.durationTicks;
    if (delta === 0 && measure.index === index) return measure;
    return {
      ...measure,
      index,
      startTick: measure.startTick + delta,
      voices: measure.voices.map((voice) => ({
        ...voice,
        events: voice.events.map((event) => ({
          ...event,
          startTick: event.startTick + delta,
        })),
      })),
    };
  });
  return { ...track, measures };
}

/** Ticks and tempi in range, and the map put back in tick order. */
function repairTempoMap(tempoMap: readonly TempoEvent[]): TempoEvent[] {
  return tempoMap
    .map((event) => ({
      ...event,
      tick: Math.max(0, event.tick),
      bpm: clamp(event.bpm, MIN_BPM, MAX_BPM),
    }))
    .sort((a, b) => a.tick - b.tick);
}

/**
 * Tie flags that point at nothing, cleared.
 *
 * Driven by the validator's own report rather than by a second implementation
 * of "does this note have a partner": that question is subtle enough — voice
 * channels, adjoining ticks, spelling — that a private copy of the rule here
 * would be a second thing to keep in step, and the first to fall out of it.
 */
function clearDanglingTies(
  score: Score,
  issues: readonly ValidationIssue[],
): Score {
  const dangling = new Set(
    issues
      .filter((issue) => issue.code === ISSUE_CODES.MISSING_TIE_TARGET)
      .map((issue) => issue.objectId)
      .filter((id): id is string => id !== undefined),
  );
  if (dangling.size === 0) return score;
  return {
    ...score,
    tracks: score.tracks.map((track) => ({
      ...track,
      measures: track.measures.map((measure) => ({
        ...measure,
        voices: measure.voices.map((voice) => ({
          ...voice,
          events: voice.events.map((event) => {
            if (!dangling.has(event.id) || !isNoteEvent(event)) return event;
            // Rebuilt without the flags rather than destructured around them:
            // an unused binding is exactly what the lint forbids, and naming
            // the two keys here says which ones a dangling tie loses.
            const cleared = { ...event };
            delete cleared.tieStart;
            delete cleared.tieStop;
            return cleared;
          }),
        })),
      })),
    })),
  };
}

/**
 * Repairs every rule this can, and reports what it actually achieved.
 *
 * Returns the input score by reference when it was already clean, so a caller
 * dispatching this as a command can tell "nothing to do" from "something
 * changed" without diffing.
 */
export function repairScore(score: Score): ScoreRepair {
  const before = validateScore(score);
  if (before.length === 0) return { score, fixed: {}, remaining: {} };

  let working = repairIds(score);
  working = { ...working, tempoMap: repairTempoMap(working.tempoMap) };

  const taken = new Set<string>();
  const collect = (candidate: Score): void => {
    taken.add(candidate.id);
    for (const tempo of candidate.tempoMap) taken.add(tempo.id);
    for (const track of candidate.tracks) {
      taken.add(track.id);
      for (const measure of track.measures) {
        taken.add(measure.id);
        for (const voice of measure.voices) {
          taken.add(voice.id);
          for (const event of voice.events) taken.add(event.id);
        }
      }
    }
  };
  collect(working);

  working = {
    ...working,
    tracks: working.tracks.map((rawTrack) => {
      const track = repairMeasureOrdering(repairTrackHeader(rawTrack));
      return {
        ...track,
        measures: track.measures.map((rawMeasure) => {
          const measure = repairSignatures(rawMeasure);
          return {
            ...measure,
            voices: measure.voices.map((voice) => {
              const inside = repairEvents(voice.events, measure, track, voice);
              const separated = repairOverlaps(inside);
              return {
                ...voice,
                events: fillGaps(separated, measure, track, voice, taken),
              };
            }),
          };
        }),
      };
    }),
  };

  working = clearDanglingTies(working, validateScore(working));

  const after = validateScore(working);
  const beforeCounts = countByCode(before);
  const remaining = countByCode(after);
  const fixed: Record<string, number> = {};
  for (const [code, count] of Object.entries(beforeCounts)) {
    const cleared = count - (remaining[code] ?? 0);
    if (cleared > 0) fixed[code] = cleared;
  }
  return { score: working, fixed, remaining };
}
