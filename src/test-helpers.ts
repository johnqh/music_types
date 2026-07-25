/**
 * Test-only stand-in for @sudobility/music_lib's `createEmptyScore` factory.
 * Builds shape-valid scores (4/4, 480 PPQ, one voice per measure filled with
 * a whole rest) for schema tests — music_types cannot depend on music_lib.
 */
import type { Clef, Measure, Score, Track } from './index';

type TestTrackOpts = {
  name: string;
  instrumentName?: string;
  midiProgram?: number;
  midiChannel?: number;
  clef?: Clef;
};

type TestScoreOpts = {
  title: string;
  measures?: number;
  tracks?: TestTrackOpts[];
  ppq?: number;
  tempo?: number;
};

let nextId = 0;
function id(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function createEmptyScore(opts: TestScoreOpts): Score {
  const ppq = opts.ppq ?? 480;
  const measureCount = opts.measures ?? 4;
  const measureTicks = ppq * 4;
  const trackOpts = opts.tracks ?? [{ name: 'Track 1' }];

  const tracks: Track[] = trackOpts.map((t) => {
    const trackId = id('track');
    const measures: Measure[] = Array.from({ length: measureCount }, (_, index) => {
      const voiceId = id('voice');
      return {
        id: id('measure'),
        index,
        startTick: index * measureTicks,
        durationTicks: measureTicks,
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { fifths: 0, mode: 'major' as const },
        voices: [
          {
            id: voiceId,
            name: 'Voice 1',
            events: [
              {
                id: id('rest'),
                startTick: index * measureTicks,
                durationTicks: measureTicks,
                voiceId,
                trackId,
              },
            ],
          },
        ],
      };
    });
    return {
      id: trackId,
      name: t.name,
      instrumentName: t.instrumentName ?? t.name,
      midiProgram: t.midiProgram ?? 0,
      midiChannel: t.midiChannel ?? 0,
      clef: t.clef ?? 'treble',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      measures,
    };
  });

  return {
    id: id('score'),
    version: 1,
    ppq,
    metadata: {
      title: opts.title,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    tempoMap: [{ id: id('tempo'), tick: 0, bpm: opts.tempo ?? 120 }],
    tracks,
  };
}

/** Test-only minimal `extractFragment` (real one lives in @sudobility/music_lib). */
export function extractFragment(
  score: Score,
  range: { startTick: number; endTick: number; trackIds: string[] }
): import('./index').ScoreFragment {
  const wanted = new Set(range.trackIds);
  const tracks = score.tracks
    .filter((t) => wanted.size === 0 || wanted.has(t.id))
    .map((t) => ({
      trackId: t.id,
      measures: t.measures.filter(
        (m) => m.startTick < range.endTick && m.startTick + m.durationTicks > range.startTick
      ),
    }));
  return { range, ppq: score.ppq, tracks };
}
