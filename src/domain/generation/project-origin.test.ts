import { describe, expect, it } from "vitest";
import { originAfterJob } from "./project-origin";

describe("originAfterJob", () => {
  it("makes a blank project generated, naming the job", () => {
    expect(originAfterJob({ kind: "blank" }, "generate-score", "j1")).toEqual({
      kind: "generated",
      jobId: "j1",
    });
  });

  it("treats a row from before origins existed as blank", () => {
    expect(originAfterJob(null, "generate-score", "j1")).toEqual({
      kind: "generated",
      jobId: "j1",
    });
    expect(originAfterJob(undefined, "generate-score", "j1")).toEqual({
      kind: "generated",
      jobId: "j1",
    });
  });

  it("keeps an imported project imported when a score is generated into it", () => {
    const imported = { kind: "imported", format: "midi", fileName: "a.mid" } as const;
    expect(originAfterJob(imported, "generate-score", "j1")).toBe(imported);
  });

  it("keeps the first generation's job, not the latest", () => {
    const first = { kind: "generated", jobId: "j1" } as const;
    expect(originAfterJob(first, "generate-score", "j2")).toBe(first);
  });

  it("leaves every origin alone for a track or a region job", () => {
    for (const kind of [
      "generate-track",
      "replace-notes",
      "replace-measures",
      "replace-track",
    ] as const) {
      expect(originAfterJob({ kind: "blank" }, kind, "j1")).toEqual({
        kind: "blank",
      });
      expect(originAfterJob(null, kind, "j1")).toBeNull();
    }
  });
});
