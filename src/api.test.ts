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
      uiPrefs: { view: 'notation', zoom: 1 },
    });
    expect(parsed.name).toBe('My Song');
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

  it('rejects an update with an invalid uiPrefs view', () => {
    expect(() =>
      projectUpdateRequestSchema.parse({ uiPrefs: { view: 'timeline', zoom: 1 } })
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
