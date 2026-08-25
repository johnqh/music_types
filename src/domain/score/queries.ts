import type { ScoreRange } from "../selection/types.js";
import type {
  Measure,
  MusicalEvent,
  NoteEvent,
  Score,
  Track,
  UUID,
} from "../../index.js";
import { isNoteEvent } from "../../index.js";
import { pitchToMidi } from "../pitch/pitch.js";

/** Finds a track by id, or `null` if no track has that id. */
export function findTrack(score: Score, trackId: UUID): Track | null {
  return score.tracks.find((track) => track.id === trackId) ?? null;
}

/** Finds a measure by id across all tracks, or `null` if none has that id. */
export function findMeasure(score: Score, measureId: UUID): Measure | null {
  for (const track of score.tracks) {
    const measure = track.measures.find((m) => m.id === measureId);
    if (measure) return measure;
  }
  return null;
}

/** Finds an event (note or rest) by id across all tracks/measures/voices, or `null`. */
export function findEvent(score: Score, eventId: UUID): MusicalEvent | null {
  for (const track of score.tracks) {
    for (const measure of track.measures) {
      for (const voice of measure.voices) {
        const event = voice.events.find((e) => e.id === eventId);
        if (event) return event;
      }
    }
  }
  return null;
}

/** Whether track `trackId` is included by a range's `trackIds` (empty array means "all tracks"). */
function rangeIncludesTrack(range: ScoreRange, trackId: UUID): boolean {
  return range.trackIds.length === 0 || range.trackIds.includes(trackId);
}

/** Whether `[startTick, startTick + durationTicks)` overlaps `[range.startTick, range.endTick)`. */
function overlapsRange(
  startTick: number,
  durationTicks: number,
  range: ScoreRange,
): boolean {
  return (
    startTick < range.endTick && startTick + durationTicks > range.startTick
  );
}

/** All note events (rests excluded) on the requested tracks overlapping the tick range. */
export function eventsInRange(score: Score, range: ScoreRange): NoteEvent[] {
  const result: NoteEvent[] = [];
  for (const track of score.tracks) {
    if (!rangeIncludesTrack(range, track.id)) continue;
    for (const measure of track.measures) {
      for (const voice of measure.voices) {
        for (const event of voice.events) {
          if (
            isNoteEvent(event) &&
            overlapsRange(event.startTick, event.durationTicks, range)
          ) {
            result.push(event);
          }
        }
      }
    }
  }
  return result;
}

/** Measures overlapping the tick range, grouped by track. */
export function measuresInRange(
  score: Score,
  range: ScoreRange,
): Array<{ trackId: UUID; measures: Measure[] }> {
  const result: Array<{ trackId: UUID; measures: Measure[] }> = [];
  for (const track of score.tracks) {
    if (!rangeIncludesTrack(range, track.id)) continue;
    const measures = track.measures.filter((m) =>
      overlapsRange(m.startTick, m.durationTicks, range),
    );
    result.push({ trackId: track.id, measures });
  }
  return result;
}

/**
 * Finds a note event on `trackId` whose span covers `tick`
 * (`startTick <= tick < startTick + durationTicks`), optionally also
 * matching a specific MIDI pitch. Returns `null` if none match.
 */
export function noteAt(
  score: Score,
  trackId: UUID,
  tick: number,
  midi?: number,
): NoteEvent | null {
  const track = findTrack(score, trackId);
  if (!track) return null;

  for (const measure of track.measures) {
    for (const voice of measure.voices) {
      for (const event of voice.events) {
        if (!isNoteEvent(event)) continue;
        if (
          tick < event.startTick ||
          tick >= event.startTick + event.durationTicks
        )
          continue;
        if (midi !== undefined && pitchToMidi(event.pitch) !== midi) continue;
        return event;
      }
    }
  }
  return null;
}

/** The tick at which the score's last measure (across all tracks) ends; 0 if there are none. */
export function scoreEndTick(score: Score): number {
  let end = 0;
  for (const track of score.tracks) {
    const lastMeasure = track.measures[track.measures.length - 1];
    if (lastMeasure) {
      end = Math.max(end, lastMeasure.startTick + lastMeasure.durationTicks);
    }
  }
  return end;
}

/** All note events (rests excluded) across every track/measure/voice. */
export function allNotes(score: Score): NoteEvent[] {
  const notes: NoteEvent[] = [];
  for (const track of score.tracks) {
    for (const measure of track.measures) {
      for (const voice of measure.voices) {
        for (const event of voice.events) {
          if (isNoteEvent(event)) notes.push(event);
        }
      }
    }
  }
  return notes;
}

/**
 * `score` with only the named tracks, in score order.
 *
 * Returns `score` itself when `trackIds` names every track, so the common
 * "nothing is hidden" export path costs nothing. Kept tracks are returned by
 * reference — this filters, it never rewrites the music.
 */
export function scoreWithTracks(score: Score, trackIds: string[]): Score {
  const wanted = new Set(trackIds);
  const tracks = score.tracks.filter((track) => wanted.has(track.id));
  if (tracks.length === score.tracks.length) return score;
  return { ...score, tracks };
}

/**
 * A track's notes in tick order.
 *
 * Lyric entry walks these, and so does anything that means "the next note
 * after here" — so the sort is part of the answer rather than something each
 * caller remembers. Rests are dropped: they carry no syllable and nothing that
 * steps through notes wants to stop on one.
 */
export function trackNotesInOrder(score: Score, trackId: UUID): NoteEvent[] {
  const track = findTrack(score, trackId);
  if (!track) return [];
  const notes: NoteEvent[] = [];
  for (const measure of track.measures) {
    for (const voice of measure.voices) {
      for (const event of voice.events) {
        if (isNoteEvent(event)) notes.push(event);
      }
    }
  }
  return notes.sort((a, b) => a.startTick - b.startTick);
}

/**
 * The index of the first note at or after `tick`, or 0 when the tick is past
 * every note.
 *
 * Falling back to the start rather than to -1: "begin here" with the caret
 * past the end means begin at the beginning, which is what a writer expects
 * from a command that has to start somewhere.
 */
export function noteIndexAtOrAfter(
  notes: readonly NoteEvent[],
  tick: number,
): number {
  const at = notes.findIndex((note) => note.startTick >= tick);
  return at === -1 ? 0 : at;
}

/**
 * Which voice a note is in, counted from 1.
 *
 * From 1 because that is what the toolbar's own Voice 1 / Voice 2 buttons say;
 * the same note used to read as "Voice 1" on the bar and `0` in the panel.
 */
export function voiceNumberOf(score: Score, note: NoteEvent): number {
  for (const track of score.tracks) {
    for (const measure of track.measures) {
      const index = measure.voices.findIndex((v) => v.id === note.voiceId);
      if (index >= 0) return index + 1;
    }
  }
  return 1;
}

/** The position of a measure in its own track, or `null` if it is not in the score. */
export function measureIndexOf(score: Score, measureId: UUID): number | null {
  for (const track of score.tracks) {
    const index = track.measures.findIndex((m) => m.id === measureId);
    if (index >= 0) return index;
  }
  return null;
}

/** The measure holding `tick` on `trackId`, clamped to the last one past the end. */
export function measureAtTick(
  score: Score,
  trackId: UUID,
  tick: number,
): Measure | null {
  const track = findTrack(score, trackId);
  if (!track || track.measures.length === 0) return null;
  return (
    track.measures.find(
      (m) => tick >= m.startTick && tick < m.startTick + m.durationTicks,
    ) ?? track.measures[track.measures.length - 1]
  );
}

/**
 * The ids of notes whose sound overlaps `range` on the range's own tracks.
 *
 * Overlap, not containment: a note that starts before the range and is still
 * sounding inside it was replaced by whatever was written there, so it is part
 * of what changed.
 */
export function noteIdsOverlappingRange(
  score: Score,
  range: ScoreRange,
): UUID[] {
  return allNotes(score)
    .filter(
      (note) =>
        range.trackIds.includes(note.trackId) &&
        note.startTick < range.endTick &&
        note.startTick + note.durationTicks > range.startTick,
    )
    .map((note) => note.id);
}

/** The track a measure belongs to, or `null` if it is not in the score. */
export function trackOfMeasure(score: Score, measureId: UUID): Track | null {
  return (
    score.tracks.find((t) => t.measures.some((m) => m.id === measureId)) ?? null
  );
}

/**
 * How many bars the score has.
 *
 * Off track 0, because every track shares the measure grid — the convention
 * the layout, the gutter and `measureIndexOf` all already rely on.
 */
export function barCount(score: Score | null): number {
  return score?.tracks[0]?.measures.length ?? 0;
}
