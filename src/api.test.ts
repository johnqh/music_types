/**
 * Tests for the project API types/schemas and the response envelope —
 * new surface introduced by music_types (not moved from the app).
 */
import { describe, expect, it } from "vitest";
import {
  API_ERROR_CODES,
  errorResponse,
  projectCreateRequestSchema,
  projectDuplicateRequestSchema,
  projectListQuerySchema,
  projectRecordSchema,
  projectSaveResultSchema,
  projectSummarySchema,
  projectUpdateRequestSchema,
  communityItemSchema,
  publishRequestSchema,
  publishedSnapshotSchema,
  snapshotCreateRequestSchema,
  snapshotSchema,
  snapshotSummarySchema,
  successResponse,
} from "./index";
import { createEmptyScore } from "./test-helpers";

describe("envelope helpers", () => {
  it("successResponse wraps data with success: true and no error", () => {
    expect(successResponse({ x: 1 })).toEqual({
      success: true,
      data: { x: 1 },
    });
  });

  it("errorResponse wraps a message with success: false", () => {
    expect(errorResponse("boom")).toEqual({ success: false, error: "boom" });
  });

  it("errorResponse includes a typed code when given", () => {
    expect(errorResponse("limit", API_ERROR_CODES.QUOTA_EXCEEDED)).toEqual({
      success: false,
      error: "limit",
      code: "QUOTA_EXCEEDED",
    });
  });
});

describe("project schemas", () => {
  const score = createEmptyScore({
    title: "P",
    measures: 1,
    tracks: [{ name: "Piano" }],
  });

  it("accepts a valid create request", () => {
    const parsed = projectCreateRequestSchema.parse({
      name: "My Song",
      score,
      uiPrefs: { zoom: 1 },
    });
    expect(parsed.name).toBe("My Song");
  });

  it("accepts a measure carrying a multi-measure rest count", () => {
    const withCount = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, multiMeasureRestCount: 24 })),
      })),
    };
    const parsed = projectCreateRequestSchema.parse({
      name: "P",
      score: withCount,
    });
    expect(parsed.score.tracks[0].measures[0].multiMeasureRestCount).toBe(24);
  });

  it("accepts a measure without one, which is every ordinary measure", () => {
    const parsed = projectCreateRequestSchema.parse({ name: "P", score });
    expect(
      parsed.score.tracks[0].measures[0].multiMeasureRestCount,
    ).toBeUndefined();
  });

  it("rejects a count of one, which is not a multi-measure rest", () => {
    // One bar of silence is written out; a "1" over a bar is noise.
    const withOne = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, multiMeasureRestCount: 1 })),
      })),
    };
    expect(() =>
      projectCreateRequestSchema.parse({ name: "P", score: withOne }),
    ).toThrow();
  });

  it("accepts a measure carrying a rehearsal mark", () => {
    const withMark = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, rehearsalMark: "B" })),
      })),
    };
    const parsed = projectCreateRequestSchema.parse({
      name: "P",
      score: withMark,
    });
    expect(parsed.score.tracks[0].measures[0].rehearsalMark).toBe("B");
  });

  it("rejects an empty rehearsal mark", () => {
    // A mark nobody can call out is not a mark.
    const withEmpty = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({ ...m, rehearsalMark: "" })),
      })),
    };
    expect(() =>
      projectCreateRequestSchema.parse({ name: "P", score: withEmpty }),
    ).toThrow();
  });

  it("accepts a measure carrying a cue", () => {
    const withCue = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({
          ...m,
          cue: {
            label: "Flute",
            events: [
              {
                id: "cue-1",
                pitch: { step: "C", accidental: 0, octave: 5 },
                startTick: 0,
                durationTicks: 480,
                velocity: 80,
                voiceId: "v1",
                trackId: "t1",
              },
            ],
          },
        })),
      })),
    };
    const parsed = projectCreateRequestSchema.parse({
      name: "P",
      score: withCue,
    });
    expect(parsed.score.tracks[0].measures[0].cue?.label).toBe("Flute");
    expect(parsed.score.tracks[0].measures[0].cue?.events).toHaveLength(1);
  });

  it("rejects a cue with no label", () => {
    // An unlabelled cue is notes the player cannot attribute — worse than none.
    const withEmpty = {
      ...score,
      tracks: score.tracks.map((t) => ({
        ...t,
        measures: t.measures.map((m) => ({
          ...m,
          cue: { label: "", events: [] },
        })),
      })),
    };
    expect(() =>
      projectCreateRequestSchema.parse({ name: "P", score: withEmpty }),
    ).toThrow();
  });

  it("rejects a create request with an empty name", () => {
    expect(() =>
      projectCreateRequestSchema.parse({ name: "", score }),
    ).toThrow();
  });

  it("rejects a create request with an invalid embedded score", () => {
    expect(() =>
      projectCreateRequestSchema.parse({ name: "X", score: { nope: true } }),
    ).toThrow();
  });

  it("accepts a partial update request (all fields optional)", () => {
    expect(projectUpdateRequestSchema.parse({})).toEqual({});
    expect(projectUpdateRequestSchema.parse({ name: "Renamed" }).name).toBe(
      "Renamed",
    );
  });

  it("accepts uiPrefs carrying visibleTrackIds", () => {
    const parsed = projectUpdateRequestSchema.parse({
      uiPrefs: { zoom: 1, visibleTrackIds: ["t1", "t2"] },
    });
    expect(parsed.uiPrefs?.visibleTrackIds).toEqual(["t1", "t2"]);
  });

  it("accepts uiPrefs without visibleTrackIds, meaning all tracks visible", () => {
    const parsed = projectUpdateRequestSchema.parse({ uiPrefs: { zoom: 1 } });
    expect(parsed.uiPrefs?.visibleTrackIds).toBeUndefined();
  });

  it("rejects an empty visibleTrackIds, which would mean a blank page", () => {
    expect(() =>
      projectUpdateRequestSchema.parse({
        uiPrefs: { zoom: 1, visibleTrackIds: [] },
      }),
    ).toThrow();
  });

  it("parses a full ProjectRecord and a score-less ProjectSummary distinctly", () => {
    const summary = {
      id: "p1",
      name: "A",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      schemaVersion: 1,
    };
    expect(projectSummarySchema.parse(summary).id).toBe("p1");
    expect(() => projectRecordSchema.parse(summary)).toThrow();
    expect(projectRecordSchema.parse({ ...summary, score }).score.ppq).toBe(
      480,
    );
  });

  it("parses a save result, which carries everything about a project but the score", () => {
    // What a write returns. The caller already holds the score it just sent,
    // so echoing it back doubled the cost of every autosave.
    const saved = {
      id: "p1",
      name: "A",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:01.000Z",
      schemaVersion: 1,
      uiPrefs: { zoom: 1, visibleTrackIds: ["t1"] },
      parentSnapshotId: null,
    };
    expect(projectSaveResultSchema.parse(saved).updatedAt).toBe(
      "2026-01-01T00:00:01.000Z",
    );
    expect("score" in projectSaveResultSchema.parse(saved)).toBe(false);
    // The score-carrying read is the strictly stronger shape, so it still rejects one.
    expect(() => projectRecordSchema.parse(saved)).toThrow();
  });

  it('accepts a duplicate request with no name, which means "<name> (copy)"', () => {
    expect(projectDuplicateRequestSchema.parse({}).name).toBeUndefined();
    expect(projectDuplicateRequestSchema.parse({ name: "Take 2" }).name).toBe(
      "Take 2",
    );
    expect(() => projectDuplicateRequestSchema.parse({ name: "" })).toThrow();
  });

  it("parses list query with defaults absent and rejects unknown sort", () => {
    expect(projectListQuerySchema.parse({})).toEqual({});
    expect(
      projectListQuerySchema.parse({ sort: "name", search: "so" }).sort,
    ).toBe("name");
    expect(() => projectListQuerySchema.parse({ sort: "oldest" })).toThrow();
  });
});

describe("snapshot schemas", () => {
  const score = createEmptyScore({
    title: "P",
    measures: 1,
    tracks: [{ name: "Piano" }],
  });
  const base = {
    id: "11111111-1111-4111-8111-111111111111",
    projectId: "22222222-2222-4222-8222-222222222222",
    parentId: null,
    name: "Version 1",
    score,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("accepts a snapshot with no parent, which is the first in a project", () => {
    expect(snapshotSchema.parse(base).parentId).toBeNull();
  });

  it("accepts a snapshot that grew from another", () => {
    const child = {
      ...base,
      id: "33333333-3333-4333-8333-333333333333",
      parentId: base.id,
    };
    expect(snapshotSchema.parse(child).parentId).toBe(base.id);
  });

  it("rejects an unnamed snapshot", () => {
    // A nameless version cannot be chosen from a picker.
    expect(() => snapshotSchema.parse({ ...base, name: "" })).toThrow();
  });

  it("summarises without the score, which the picker never needs", () => {
    const summary = snapshotSummarySchema.parse({ ...base, score: undefined });
    expect("score" in summary).toBe(false);
  });

  it("keeps publishing state on the summary, so a publish need not return a score", () => {
    const summary = snapshotSummarySchema.parse({
      ...base,
      score: undefined,
      publicId: "pub_x",
      publisherName: "Jane",
    });
    expect(summary.publicId).toBe("pub_x");
    expect("score" in summary).toBe(false);
  });

  it("accepts a create request carrying just a name", () => {
    expect(
      snapshotCreateRequestSchema.parse({ name: "Before the coda" }).name,
    ).toBe("Before the coda");
  });

  it("accepts a project record that knows which snapshot it descends from", () => {
    const record = projectRecordSchema.parse({
      id: "p1",
      name: "A",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      schemaVersion: 1,
      score,
      parentSnapshotId: base.id,
    });
    expect(record.parentSnapshotId).toBe(base.id);
  });

  it("accepts a project record with no parent, which is one never snapshotted", () => {
    const record = projectRecordSchema.parse({
      id: "p1",
      name: "A",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      schemaVersion: 1,
      score,
    });
    expect(record.parentSnapshotId ?? null).toBeNull();
  });
});

describe("publishing schemas", () => {
  const score = createEmptyScore({
    title: "P",
    measures: 1,
    tracks: [{ name: "Piano" }],
  });
  const published = {
    publicId: "pub_abc123",
    name: "Version 1",
    publicName: "My Song Version 1",
    publisherName: "Jane",
    score,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("accepts a published snapshot", () => {
    expect(publishedSnapshotSchema.parse(published).publicId).toBe(
      "pub_abc123",
    );
  });

  it("rejects a published snapshot with no publisher name", () => {
    // The Community list would show an anonymous row it cannot attribute.
    expect(() =>
      publishedSnapshotSchema.parse({ ...published, publisherName: "" }),
    ).toThrow();
  });

  it("strips anything not on the public shape", () => {
    // The guard that matters: no userId, no email, ever reaches a public page.
    const parsed = publishedSnapshotSchema.parse({
      ...published,
      userId: "uid-1",
      email: "a@b.c",
    }) as Record<string, unknown>;
    expect(parsed.userId).toBeUndefined();
    expect(parsed.email).toBeUndefined();
  });

  it("lists a community item without its score", () => {
    const item = communityItemSchema.parse({ ...published, score: undefined });
    expect("score" in item).toBe(false);
  });

  it("accepts a publish request carrying a publisher name", () => {
    expect(
      publishRequestSchema.parse({
        publisherName: "Jane",
        publicName: "My Song Version 1",
      }).publisherName,
    ).toBe("Jane");
  });

  it("rejects a publish request with no public name", () => {
    // The version label is what would show on the public page instead, and
    // "Version 1" tells a stranger nothing.
    expect(() =>
      publishRequestSchema.parse({ publisherName: "Jane" }),
    ).toThrow();
  });

  it("keeps the public title apart from the version label", () => {
    // Both travel: the picker still needs "Version 1" while the public page
    // shows the title.
    const parsed = publishedSnapshotSchema.parse(published);
    expect(parsed.name).toBe("Version 1");
    expect(parsed.publicName).toBe("My Song Version 1");
  });

  it("accepts a snapshot that is published, and one that is not", () => {
    const base = {
      id: "11111111-1111-4111-8111-111111111111",
      projectId: "22222222-2222-4222-8222-222222222222",
      parentId: null,
      name: "Version 1",
      score,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(snapshotSchema.parse(base).publicId).toBeUndefined();
    expect(
      snapshotSchema.parse({
        ...base,
        publicId: "pub_x",
        publisherName: "Jane",
      }).publicId,
    ).toBe("pub_x");
  });
});
