/**
 * Tests for the project API types/schemas and the response envelope —
 * new surface introduced by music_types (not moved from the app).
 */
import { describe, expect, it } from 'vitest';
import {
  API_ERROR_CODES,
  errorResponse,
  projectCreateRequestSchema,
  projectListQuerySchema,
  projectRecordSchema,
  projectSummarySchema,
  projectUpdateRequestSchema,
  successResponse,
} from './index';
import { createEmptyScore } from './test-helpers';

describe('envelope helpers', () => {
  it('successResponse wraps data with success: true and no error', () => {
    expect(successResponse({ x: 1 })).toEqual({ success: true, data: { x: 1 } });
  });

  it('errorResponse wraps a message with success: false', () => {
    expect(errorResponse('boom')).toEqual({ success: false, error: 'boom' });
  });

  it('errorResponse includes a typed code when given', () => {
    expect(errorResponse('limit', API_ERROR_CODES.QUOTA_EXCEEDED)).toEqual({
      success: false,
      error: 'limit',
      code: 'QUOTA_EXCEEDED',
    });
  });
});

describe('project schemas', () => {
  const score = createEmptyScore({ title: 'P', measures: 1, tracks: [{ name: 'Piano' }] });

  it('accepts a valid create request', () => {
    const parsed = projectCreateRequestSchema.parse({
      name: 'My Song',
      score,
      uiPrefs: { zoom: 1 },
    });
    expect(parsed.name).toBe('My Song');
  });

  it('accepts a measure carrying a multi-measure rest count', () => {
    const withCount = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, multiMeasureRestCount: 24 })),
      })),
    };
    const parsed = projectCreateRequestSchema.parse({ name: 'P', score: withCount });
    expect(parsed.score.tracks[0].measures[0].multiMeasureRestCount).toBe(24);
  });

  it('accepts a measure without one, which is every ordinary measure', () => {
    const parsed = projectCreateRequestSchema.parse({ name: 'P', score });
    expect(parsed.score.tracks[0].measures[0].multiMeasureRestCount).toBeUndefined();
  });

  it('rejects a count of one, which is not a multi-measure rest', () => {
    // One bar of silence is written out; a "1" over a bar is noise.
    const withOne = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, multiMeasureRestCount: 1 })),
      })),
    };
    expect(() => projectCreateRequestSchema.parse({ name: 'P', score: withOne })).toThrow();
  });

  it('accepts a measure carrying a rehearsal mark', () => {
    const withMark = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, rehearsalMark: 'B' })),
      })),
    };
    const parsed = projectCreateRequestSchema.parse({ name: 'P', score: withMark });
    expect(parsed.score.tracks[0].measures[0].rehearsalMark).toBe('B');
  });

  it('rejects an empty rehearsal mark', () => {
    // A mark nobody can call out is not a mark.
    const withEmpty = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, rehearsalMark: '' })),
      })),
    };
    expect(() => projectCreateRequestSchema.parse({ name: 'P', score: withEmpty })).toThrow();
  });

  it('accepts a measure carrying a cue', () => {
    const withCue = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({
          ...m,
          cue: {
            label: 'Flute',
            events: [
              {
                id: 'cue-1',
                pitch: { step: 'C', accidental: 0, octave: 5 },
                startTick: 0,
                durationTicks: 480,
                velocity: 80,
                voiceId: 'v1',
                trackId: 't1',
              },
            ],
          },
        })),
      })),
    };
    const parsed = projectCreateRequestSchema.parse({ name: 'P', score: withCue });
    expect(parsed.score.tracks[0].measures[0].cue?.label).toBe('Flute');
    expect(parsed.score.tracks[0].measures[0].cue?.events).toHaveLength(1);
  });

  it('rejects a cue with no label', () => {
    // An unlabelled cue is notes the player cannot attribute — worse than none.
    const withEmpty = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, cue: { label: '', events: [] } })),
      })),
    };
    expect(() => projectCreateRequestSchema.parse({ name: 'P', score: withEmpty })).toThrow();
  });

  it('rejects a create request with an empty name', () => {
    expect(() => projectCreateRequestSchema.parse({ name: '', score })).toThrow();
  });

  it('rejects a create request with an invalid embedded score', () => {
    expect(() =>
      projectCreateRequestSchema.parse({ name: 'X', score: { nope: true } })
    ).toThrow();
  });

  it('accepts a partial update request (all fields optional)', () => {
    expect(projectUpdateRequestSchema.parse({})).toEqual({});
    expect(projectUpdateRequestSchema.parse({ name: 'Renamed' }).name).toBe('Renamed');
  });

  it('accepts uiPrefs carrying visibleTrackIds', () => {
    const parsed = projectUpdateRequestSchema.parse({
      uiPrefs: { zoom: 1, visibleTrackIds: ['t1', 't2'] },
    });
    expect(parsed.uiPrefs?.visibleTrackIds).toEqual(['t1', 't2']);
  });

  it('accepts uiPrefs without visibleTrackIds, meaning all tracks visible', () => {
    const parsed = projectUpdateRequestSchema.parse({ uiPrefs: { zoom: 1 } });
    expect(parsed.uiPrefs?.visibleTrackIds).toBeUndefined();
  });

  it('rejects an empty visibleTrackIds, which would mean a blank page', () => {
    expect(() =>
      projectUpdateRequestSchema.parse({ uiPrefs: { zoom: 1, visibleTrackIds: [] } })
    ).toThrow();
  });

  it('parses a full ProjectRecord and a score-less ProjectSummary distinctly', () => {
    const summary = {
      id: 'p1',
      name: 'A',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      schemaVersion: 1,
    };
    expect(projectSummarySchema.parse(summary).id).toBe('p1');
    expect(() => projectRecordSchema.parse(summary)).toThrow();
    expect(projectRecordSchema.parse({ ...summary, score }).score.ppq).toBe(480);
  });

  it('parses list query with defaults absent and rejects unknown sort', () => {
    expect(projectListQuerySchema.parse({})).toEqual({});
    expect(projectListQuerySchema.parse({ sort: 'name', search: 'so' }).sort).toBe('name');
    expect(() => projectListQuerySchema.parse({ sort: 'oldest' })).toThrow();
  });
});
