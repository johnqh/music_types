import { describe, expect, it } from 'vitest';
import { createEmptyScore } from './test-helpers';
import { extractFragment } from './test-helpers';
import {
  generateScoreRequestSchema,
  generateScoreResultSchema,
  parseGenerateScoreRequest,
  parseRegenerateRegionRequest,
  regenerateRegionRequestSchema,
  regenerateRegionResultSchema,
  regenerationConstraintsSchema,
  createGenerationJobRequestSchema,
  generationJobSchema,
  scoreFragmentSchema,
  scoreRangeSchema,
} from './index';
import type { GenerateScoreRequest, RegenerateRegionRequest } from './index';

function validGenerateRequest(): GenerateScoreRequest {
  return {
    prompt: 'Create a gentle eight-measure piano melody in C major',
    durationMeasures: 8,
    tracks: [{ name: 'Piano', instrumentName: 'Piano', midiProgram: 0, clef: 'treble' }],
  };
}

describe('scoreRangeSchema / scoreFragmentSchema', () => {
  it('accepts a valid ScoreRange and ScoreFragment', () => {
    const score = createEmptyScore({ title: 'S', measures: 2, tracks: [{ name: 'Piano' }] });
    const track = score.tracks[0];
    const range = { startTick: 0, endTick: track.measures[0].durationTicks, trackIds: [track.id] };
    const fragment = extractFragment(score, range);

    expect(scoreRangeSchema.safeParse(range).success).toBe(true);
    expect(scoreFragmentSchema.safeParse(fragment).success).toBe(true);
  });
});

describe('generateScoreRequestSchema', () => {
  it('accepts a minimal valid request', () => {
    const result = generateScoreRequestSchema.safeParse(validGenerateRequest());
    expect(result.success).toBe(true);
  });

  it('accepts an optional-fields-populated request', () => {
    const request: GenerateScoreRequest = {
      ...validGenerateRequest(),
      title: 'My Piece',
      style: 'jazz',
      mood: 'upbeat',
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { fifths: 0, mode: 'major' },
      complexity: 'complex',
      tracks: [
        {
          name: 'Piano',
          instrumentName: 'Piano',
          midiProgram: 0,
          clef: 'treble',
          range: { lowestMidi: 48, highestMidi: 84 },
          maximumPolyphony: 4,
        },
      ],
    };
    expect(generateScoreRequestSchema.safeParse(request).success).toBe(true);
  });

  it('rejects a non-positive durationMeasures', () => {
    const request = { ...validGenerateRequest(), durationMeasures: 0 };
    expect(generateScoreRequestSchema.safeParse(request).success).toBe(false);
  });

  it('rejects an invalid clef', () => {
    const request = {
      ...validGenerateRequest(),
      tracks: [{ name: 'X', instrumentName: 'X', midiProgram: 0, clef: 'soprano' }],
    };
    expect(generateScoreRequestSchema.safeParse(request).success).toBe(false);
  });

  it('parseGenerateScoreRequest throws on invalid input', () => {
    expect(() => parseGenerateScoreRequest({ prompt: 'x' })).toThrow();
  });

  it('parseGenerateScoreRequest returns a typed request on valid input', () => {
    const parsed = parseGenerateScoreRequest(validGenerateRequest());
    expect(parsed.durationMeasures).toBe(8);
  });
});

describe('generateScoreResultSchema', () => {
  it('accepts a Score + warnings result', () => {
    const score = createEmptyScore({ title: 'S' });
    const result = { score, warnings: ['note'] };
    expect(generateScoreResultSchema.safeParse(result).success).toBe(true);
  });
});

function validRegenerateRequest(): RegenerateRegionRequest {
  const score = createEmptyScore({ title: 'S', measures: 5, tracks: [{ name: 'Piano' }] });
  const track = score.tracks[0];
  const measureTicks = track.measures[0].durationTicks;
  const range = { startTick: measureTicks, endTick: 2 * measureTicks, trackIds: [track.id] };
  return {
    scoreId: score.id,
    instruction: 'Make this more dramatic',
    range,
    precedingContext: extractFragment(score, { startTick: 0, endTick: measureTicks, trackIds: [track.id] }),
    selectedFragment: extractFragment(score, range),
    followingContext: extractFragment(score, { startTick: 2 * measureTicks, endTick: 3 * measureTicks, trackIds: [track.id] }),
    constraints: { preserveMeasureCount: true, preserveTimeSignatures: true, preserveTempoEvents: true },
    candidateCount: 3,
  };
}

describe('regenerateRegionRequestSchema', () => {
  it('accepts a valid request', () => {
    expect(regenerateRegionRequestSchema.safeParse(validRegenerateRequest()).success).toBe(true);
  });

  it('accepts a request with optional constraint fields populated', () => {
    const request: RegenerateRegionRequest = {
      ...validRegenerateRequest(),
      constraints: {
        preserveMeasureCount: true,
        preserveTimeSignatures: true,
        preserveTempoEvents: true,
        preserveBoundaryNotes: true,
        preserveHarmony: false,
        preserveRhythm: true,
        preserveMelody: false,
        maximumPolyphony: 1,
        allowedPitchRangeByTrack: { 'track-1': { lowestMidi: 40, highestMidi: 80 } },
      },
    };
    expect(regenerateRegionRequestSchema.safeParse(request).success).toBe(true);
  });

  it('rejects a candidateCount of 0', () => {
    const request = { ...validRegenerateRequest(), candidateCount: 0 };
    expect(regenerateRegionRequestSchema.safeParse(request).success).toBe(false);
  });

  it('rejects preserveMeasureCount: false (constraints are always preserve=true per spec §12)', () => {
    const request = validRegenerateRequest();
    const invalid = { ...request, constraints: { ...request.constraints, preserveMeasureCount: false } };
    expect(regenerateRegionRequestSchema.safeParse(invalid).success).toBe(false);
  });

  it('parseRegenerateRegionRequest round-trips a valid request', () => {
    const request = validRegenerateRequest();
    expect(parseRegenerateRegionRequest(request).scoreId).toBe(request.scoreId);
  });
});

describe('regenerateRegionResultSchema', () => {
  it('accepts a candidates + warnings result', () => {
    const request = validRegenerateRequest();
    const result = {
      candidates: [{ id: 'c1', label: 'Variation 1', fragment: request.selectedFragment }],
      warnings: [],
    };
    expect(regenerateRegionResultSchema.safeParse(result).success).toBe(true);
  });
});

describe('createGenerationJobRequestSchema', () => {
  const valid = () => ({
    projectId: '11111111-1111-1111-1111-111111111111',
    kind: 'replace-notes' as const,
    request: { anything: true },
  });

  it('accepts each of the five kinds', () => {
    for (const kind of [
      'generate-score',
      'generate-track',
      'replace-notes',
      'replace-measures',
      'replace-track',
    ] as const) {
      expect(createGenerationJobRequestSchema.safeParse({ ...valid(), kind }).success).toBe(true);
    }
  });

  it('rejects an unknown kind', () => {
    expect(
      createGenerationJobRequestSchema.safeParse({ ...valid(), kind: 'transcribe' }).success
    ).toBe(false);
  });

  it('requires a projectId, since every job now owns one', () => {
    const rest: Record<string, unknown> = { ...valid() };
    delete rest.projectId;
    expect(createGenerationJobRequestSchema.safeParse(rest).success).toBe(false);
  });
});

describe('generationJobSchema', () => {
  const valid = () => ({
    id: '22222222-2222-2222-2222-222222222222',
    projectId: '11111111-1111-1111-1111-111111111111',
    kind: 'generate-track' as const,
    status: 'running' as const,
    createdAt: '2026-08-07T00:00:00.000Z',
    finishedAt: null,
    error: null,
  });

  it('accepts a running job with no finish time or error', () => {
    expect(generationJobSchema.safeParse(valid()).success).toBe(true);
  });

  it('accepts every terminal status', () => {
    for (const status of ['done', 'failed', 'cancelled'] as const) {
      expect(
        generationJobSchema.safeParse({
          ...valid(),
          status,
          finishedAt: '2026-08-07T00:01:00.000Z',
        }).success
      ).toBe(true);
    }
  });

  it('accepts queued, which is a job waiting its turn', () => {
    expect(generationJobSchema.safeParse({ ...valid(), status: 'queued' }).success).toBe(true);
  });

  it('rejects a status outside the five', () => {
    expect(generationJobSchema.safeParse({ ...valid(), status: 'paused' }).success).toBe(false);
  });

  it('accepts a job with no usage, which is one that never reached the model', () => {
    expect(generationJobSchema.safeParse(valid()).success).toBe(true);
  });

  it('accepts a job carrying what it cost', () => {
    expect(
      generationJobSchema.safeParse({
        ...valid(),
        usage: { promptTokens: 1760, completionTokens: 2130, model: 'gpt-5.1' },
      }).success
    ).toBe(true);
  });

  it('rejects usage with no model, which cannot be priced afterwards', () => {
    expect(
      generationJobSchema.safeParse({
        ...valid(),
        usage: { promptTokens: 1760, completionTokens: 2130 },
      }).success
    ).toBe(false);
  });

  it('rejects negative token counts', () => {
    expect(
      generationJobSchema.safeParse({
        ...valid(),
        usage: { promptTokens: -1, completionTokens: 0, model: 'gpt-5.1' },
      }).success
    ).toBe(false);
  });
});

describe('regenerateRegionRequestSchema style/mood/complexity', () => {
  it('accepts the three new optional fields', () => {
    const req = {
      ...validRegenerateRequest(),
      style: 'baroque',
      mood: 'melancholy',
      complexity: 'complex' as const,
    };
    expect(regenerateRegionRequestSchema.safeParse(req).success).toBe(true);
  });

  it('still accepts a request without them, so existing callers are unaffected', () => {
    expect(regenerateRegionRequestSchema.safeParse(validRegenerateRequest()).success).toBe(true);
  });

  it('rejects a complexity outside the enum', () => {
    const req = { ...validRegenerateRequest(), complexity: 'extreme' };
    expect(regenerateRegionRequestSchema.safeParse(req).success).toBe(false);
  });
});

describe('regenerationConstraintsSchema preserveMeasureCount', () => {
  const base = () => ({ preserveTimeSignatures: true, preserveTempoEvents: true } as const);

  it('accepts constraints without preserveMeasureCount, for a sub-measure region', () => {
    // Replace Notes spans an exact tick range that need not sit on barlines,
    // where "preserve the measure count" is meaningless.
    expect(regenerationConstraintsSchema.safeParse(base()).success).toBe(true);
  });

  it('still accepts it when present', () => {
    expect(
      regenerationConstraintsSchema.safeParse({ ...base(), preserveMeasureCount: true }).success
    ).toBe(true);
  });

  it('still rejects false, which would claim the count may change', () => {
    expect(
      regenerationConstraintsSchema.safeParse({ ...base(), preserveMeasureCount: false }).success
    ).toBe(false);
  });

  it('keeps time signatures and tempo events mandatory regardless of alignment', () => {
    expect(regenerationConstraintsSchema.safeParse({ preserveTempoEvents: true }).success).toBe(
      false
    );
    expect(regenerationConstraintsSchema.safeParse({ preserveTimeSignatures: true }).success).toBe(
      false
    );
  });
});
