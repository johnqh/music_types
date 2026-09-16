import { describe, expect, it } from "vitest";
import { DOCUMENT_EXTENSION, DOCUMENT_EXTENSIONS } from "./project-file.js";
import { EXPORT_FORMATS, IMPORT_FORMATS } from "./formats.js";
import { WRITABLE_EXPORT_FORMATS } from "./export-formats.js";

describe("WRITABLE_EXPORT_FORMATS", () => {
  it("is what the docs export table lists, plus printing", () => {
    // The docs table used to be its own list; a format added to the export
    // menu then went undocumented until somebody noticed.
    expect(EXPORT_FORMATS.map((f) => f.id)).toEqual([
      ...WRITABLE_EXPORT_FORMATS.map((f) => f.id),
      "print",
    ]);
    for (const format of WRITABLE_EXPORT_FORMATS) {
      const row = EXPORT_FORMATS.find((f) => f.id === format.id)!;
      expect(row.extensions).toBe(`.${format.extension}`);
    }
  });

  it("writes the project as the document itself, and opens every shape of one", () => {
    // Both apps overrode the plan's `json` with `.moo` by hand, and the docs
    // table went on telling readers the project file was JSON.
    const project = WRITABLE_EXPORT_FORMATS.find((f) => f.id === "project")!;
    expect(project.extension).toBe(DOCUMENT_EXTENSION);
    expect(EXPORT_FORMATS.find((f) => f.id === "project")!.extensions).toBe(
      `.${DOCUMENT_EXTENSION}`,
    );
    expect(IMPORT_FORMATS.find((f) => f.id === "project")!.extensions).toBe(
      DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(", "),
    );
  });

  it("labels every format with a key, never a word", () => {
    for (const format of WRITABLE_EXPORT_FORMATS)
      expect(format.labelKey).toMatch(/^[a-z]+\.[A-Za-z0-9]+$/);
  });
});
