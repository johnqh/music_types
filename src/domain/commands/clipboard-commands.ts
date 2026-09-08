/**
 * Clearing, and pasting a whole object.
 *
 * These are the score half of the context menu: the commands behind Clear,
 * Delete and the two shapes of Paste, for each of the three things a reader can
 * select. Delete already existed at every level (`deleteEventsCommand`,
 * `deleteMeasureCommand`, `deleteTrackCommand`); what did not was **Clear**,
 * and the two are genuinely different edits rather than two names for one.
 *
 * **Clear keeps the container and empties it.** A cleared bar is still a bar —
 * it keeps its number, its signatures, its barline, its repeats and its clef
 * change, and only the notes become a rest; a cleared track is still a track,
 * with its instrument, clef and mix intact. Delete removes the container, and
 * everything behind it moves up. Offering only Delete meant "empty these four
 * bars" had to be done by deleting them and adding four back, which loses every
 * marking on them and renumbers the rest of the score twice.
 *
 * **A bar is the same bar on every stave, so anything that changes the grid
 * changes it everywhere.** `deleteMeasureCommand` already worked that way. The
 * measure clipboard is therefore a *vertical slice* — the bars at those indices
 * across every track, not one part's — and inserting or replacing puts the
 * slice back across every track. A slice that inserted into one part would
 * leave the score's parts disagreeing about where bar 40 is, which is the thing
 * `changeRepeatsCommand` and `setPickupCommand` both refuse to allow.
 *
 * Nothing here is a store action: each is a pure `(Score) => Score` like every
 * other command, so `music_api` can apply one with no store, and the deciding —
 * insert or replace, clear or delete — stays with whoever asked.
 */
import { createId } from "../score/ids.js";
import { rebuildMeasureTicks } from "../score/factory.js";
import { transformCommand } from "./snapshot.js";
import { withTracks } from "./reflow.js";
import type { ScoreCommand } from "./types.js";
import type {
  Measure,
  MusicalEvent,
  Track,
  UUID,
  Voice,
} from "../../model/score.js";

/**
 * The bars at one span of indices, across every track.
 *
 * `tracks[i]` holds the measures copied from `score.tracks[i]`, so putting a
 * slice back is a positional match. A score with fewer tracks than the slice
 * takes what fits and drops the rest, rather than refusing: pasting four bars
 * of a quartet into a piano part should give you the piano's two staves' worth,
 * not an error.
 */
export type MeasureSlice = {
  /** How many bars the slice is long. Every entry in `tracks` has this many. */
  count: number;
  tracks: Measure[][];
};

/** One rest filling a whole bar — what an emptied measure holds. */
function restVoice(measure: Measure, trackId: UUID): Voice {
  const voiceId = createId();
  return {
    id: voiceId,
    name: "Voice 1",
    events: [
      {
        id: createId(),
        startTick: measure.startTick,
        durationTicks: measure.durationTicks,
        voiceId,
        trackId,
      },
    ],
  };
}

/**
 * The same bar with nothing played in it.
 *
 * Spread rather than rebuilt, so every field this module does not know about
 * survives — a barline, a repeat, an ending, a clef change, a pickup flag, and
 * whatever is added to `Measure` next. Rebuilding the measure from its known
 * fields is how a clear comes to silently drop a marking somebody added later.
 */
function clearedMeasure(measure: Measure, trackId: UUID): Measure {
  return { ...measure, voices: [restVoice(measure, trackId)] };
}

/** Empties the named bars, keeping the bars themselves and their markings. */
export function clearMeasuresCommand(
  measureIds: readonly UUID[],
  label: string,
): ScoreCommand {
  const wanted = new Set(measureIds);
  return transformCommand(label, (score) =>
    withTracks(
      score,
      score.tracks.map((track) => ({
        ...track,
        measures: track.measures.map((measure) =>
          wanted.has(measure.id) ? clearedMeasure(measure, track.id) : measure,
        ),
      })),
    ),
  );
}

/** Empties every bar of a track, keeping the track, its instrument and its mix. */
export function clearTrackCommand(
  trackId: UUID,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    withTracks(
      score,
      score.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              measures: track.measures.map((measure) =>
                clearedMeasure(measure, track.id),
              ),
            }
          : track,
      ),
    ),
  );
}

/**
 * A copied event, re-identified for the track it is landing in.
 *
 * Fresh ids on every paste, because an id is what the caret lights, what the
 * selection holds and what `findEvent` resolves — two events sharing one would
 * make a paste select its own source.
 */
function adoptEvent(event: MusicalEvent, voiceId: UUID, trackId: UUID): MusicalEvent {
  return { ...event, id: createId(), voiceId, trackId };
}

/**
 * A copied bar, re-identified for the track it is landing in.
 *
 * **Its `startTick` is deliberately left as the source's.** A measure and its
 * events state absolute ticks and have to agree with each other;
 * `rebuildMeasureTicks` re-times the whole score afterwards by shifting each
 * measure *and its events* by the same delta, so a bar that arrives internally
 * consistent lands correctly wherever it is spliced. Stamping the destination's
 * tick on the measure alone breaks that agreement and leaves every pasted note
 * sitting outside the bar that holds it — which looks like an empty bar, not
 * like an error.
 *
 * A pasted bar arrives **whole**: its notes, its signatures and its length. That
 * is plainly what inserting a bar means, and it is what keeps replace honest
 * too — a 3/4 bar pasted over a 4/4 one replaces the bar, not just its
 * contents. The grid stays consistent because a slice is a vertical one, so
 * every track receives the same lengths.
 */
function adoptMeasure(source: Measure, trackId: UUID): Measure {
  return {
    ...source,
    id: createId(),
    voices: source.voices.map((voice) => {
      const voiceId = createId();
      return {
        ...voice,
        id: voiceId,
        events: voice.events.map((event) =>
          adoptEvent(event, voiceId, trackId),
        ),
      };
    }),
  };
}

/**
 * A silent bar of the same shape, for a track the slice has nothing for.
 *
 * Pasting a two-track slice into a four-track score still has to give all four
 * the same bar, or the parts stop agreeing about where each bar is — so the
 * shape comes from the *slice*, never from the destination. Taking the
 * destination's shape is the subtle version of the same bug: two tracks would
 * get the pasted 3/4 bar and the rest would keep a 4/4 one.
 */
function blankLike(shape: Measure, trackId: UUID): Measure {
  const blank = { ...shape, id: createId() };
  return { ...blank, voices: [restVoice(blank, trackId)] };
}

/**
 * The bar every track should receive at this offset.
 *
 * The first track the slice actually has something for: they all came from one
 * score's grid, so any of them states the length and signatures the whole
 * column must share.
 */
function shapeAt(slice: MeasureSlice, offset: number): Measure | undefined {
  for (const measures of slice.tracks) {
    const measure = measures?.[offset];
    if (measure) return measure;
  }
  return undefined;
}

/**
 * Inserts the slice before `atIndex`, in every track.
 *
 * Everything from that bar on moves later by `slice.count` bars — which is what
 * "insert" means and why this is not `replaceMeasuresCommand` with a longer
 * score afterwards.
 */
export function insertMeasuresCommand(
  atIndex: number,
  slice: MeasureSlice,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    if (slice.count <= 0) return score;
    const tracks = score.tracks.map((track, trackIndex) => {
      const source = slice.tracks[trackIndex];
      const added: Measure[] = [];
      for (let offset = 0; offset < slice.count; offset += 1) {
        const from = source?.[offset];
        if (from) {
          added.push(adoptMeasure(from, track.id));
          continue;
        }
        const shape = shapeAt(slice, offset);
        if (shape) added.push(blankLike(shape, track.id));
      }
      if (added.length === 0) return track;
      const measures = [...track.measures];
      measures.splice(Math.max(0, atIndex), 0, ...added);
      return { ...track, measures };
    });
    return rebuildMeasureTicks(withTracks(score, tracks));
  });
}

/**
 * Overwrites `slice.count` bars starting at `atIndex`, in every track.
 *
 * The score's length does not change and nothing moves, so a slice running past
 * the end simply stops — replacing bars that are not there would be an insert
 * wearing the wrong name.
 */
export function replaceMeasuresCommand(
  atIndex: number,
  slice: MeasureSlice,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    if (slice.count <= 0) return score;
    const tracks = score.tracks.map((track, trackIndex) => {
      const source = slice.tracks[trackIndex];
      const measures = track.measures.map((measure, index) => {
        const offset = index - atIndex;
        if (offset < 0 || offset >= slice.count) return measure;
        const from = source?.[offset];
        if (from) return adoptMeasure(from, track.id);
        const shape = shapeAt(slice, offset);
        return shape ? blankLike(shape, track.id) : clearedMeasure(measure, track.id);
      });
      return { ...track, measures };
    });
    return rebuildMeasureTicks(withTracks(score, tracks));
  });
}

/**
 * A copied track, re-identified and fitted to the score it is joining.
 *
 * The bars are matched to the destination's grid by position: the score decides
 * how many bars there are and how long each is, and a pasted part fills what it
 * can. A part longer than the score is truncated rather than lengthening it,
 * because adding bars is `insertMeasuresCommand`'s job and doing it here would
 * make "paste a track" silently change every other part's length.
 */
function adoptTrack(source: Track, grid: Track | undefined): Track {
  const trackId = createId();
  const measures = (grid?.measures ?? source.measures).map((at, index) => {
    const from = source.measures[index];
    // Shaped by the *destination's* grid here, unlike a measure paste: a part
    // joining a score adopts that score's bars, where a pasted bar brings its
    // own and every part receives it.
    return from
      ? { ...adoptMeasure(from, trackId), startTick: at.startTick, index: at.index,
          durationTicks: at.durationTicks, timeSignature: at.timeSignature,
          keySignature: at.keySignature }
      : blankLike(at, trackId);
  });
  return { ...source, id: trackId, measures };
}

/** Adds the track at `atIndex`, fitted to the score's own measure grid. */
export function insertTrackCommand(
  source: Track,
  atIndex: number,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) => {
    const tracks = [...score.tracks];
    tracks.splice(
      Math.max(0, Math.min(atIndex, tracks.length)),
      0,
      adoptTrack(source, score.tracks[0]),
    );
    return rebuildMeasureTicks(withTracks(score, tracks));
  });
}

/** Replaces one track with a copied one, in place, keeping the score's grid. */
export function replaceTrackCommand(
  trackId: UUID,
  source: Track,
  label: string,
): ScoreCommand {
  return transformCommand(label, (score) =>
    rebuildMeasureTicks(
    withTracks(
      score,
      score.tracks.map((track) =>
        track.id === trackId ? adoptTrack(source, score.tracks[0]) : track,
      ),
    ),
    ),
  );
}
