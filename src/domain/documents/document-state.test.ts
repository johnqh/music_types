import { describe, expect, it } from "vitest";
import { projectOriginForDocument } from "./document-state";

describe("projectOriginForDocument", () => {
  it("records a file document as an import of that file, by its extension", () => {
    expect(
      projectOriginForDocument({ kind: "file", uri: "file:///music/Tune.moo" }),
    ).toEqual({ kind: "imported", format: "project", fileName: "Tune.moo" });
    expect(
      projectOriginForDocument({ kind: "file", uri: "/tmp/aria.mid" }),
    ).toEqual({ kind: "imported", format: "midi", fileName: "aria.mid" });
  });

  it("is blank for a document that was never saved, or one already a project", () => {
    expect(projectOriginForDocument({ kind: "unsaved" })).toEqual({
      kind: "blank",
    });
    expect(
      projectOriginForDocument({ kind: "project", projectId: "p1" }),
    ).toEqual({ kind: "blank" });
  });

  it("is blank for a file no importer reads, rather than inventing a format", () => {
    expect(
      projectOriginForDocument({ kind: "file", uri: "/tmp/notes.txt" }),
    ).toEqual({ kind: "blank" });
  });
});
