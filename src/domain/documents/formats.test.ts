import { describe, expect, it } from "vitest";
import { DOCUMENT_EXTENSION, DOCUMENT_EXTENSIONS } from "./project-file";
import {
  EXPORT_FORMATS,
  IMPORT_FORMATS,
  IMPORT_FORMAT_IDS,
  importFormatForFileName,
} from "./formats";
import { WRITABLE_EXPORT_FORMATS } from "./export-formats";

describe("IMPORT_FORMAT_IDS", () => {
  it("is exactly the ids the import table lists, so an origin can name any of them", () => {
    expect([...IMPORT_FORMAT_IDS]).toEqual(IMPORT_FORMATS.map((f) => f.id));
  });
});

describe("importFormatForFileName", () => {
  it("answers from the table's own extensions, whatever the case", () => {
    expect(importFormatForFileName("tune.mid")).toBe("midi");
    expect(importFormatForFileName("Tune.MIDI")).toBe("midi");
    expect(importFormatForFileName("aria.musicxml")).toBe("musicxml");
    expect(importFormatForFileName("song.xm")).toBe("tracker");
    expect(importFormatForFileName("take.wav")).toBe("audio");
    for (const ext of DOCUMENT_EXTENSIONS)
      expect(importFormatForFileName(`doc.${ext}`)).toBe("project");
  });

  it("is null for a file no importer reads, and for no extension at all", () => {
    expect(importFormatForFileName("notes.txt")).toBeNull();
    expect(importFormatForFileName("README")).toBeNull();
  });
});

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
