/**
 * What an export can write, as vocabulary: the formats, their extensions and
 * labels, and the shape of a plan to write one.
 *
 * Both apps offer the same menu of formats, and the docs table of export
 * formats (`EXPORT_FORMATS`, beside this) is derived from the same list, so the
 * menu and the documentation cannot come to disagree. Deciding a plan
 * (`planExport`) is music_lib's; naming the file, rendering audio and the write
 * itself belong to the packages that own each.
 */
import type { Score } from "../../model/score";
import { DOCUMENT_EXTENSION } from "./project-file";

/**
 * How a format reaches disk.
 *
 * `notation` is a single codec call; `tracker` has a fit report to show first;
 * `audio` has to be rendered by a synth before it is encoded; `project` writes
 * the document itself.
 */
export type ExportRoute = "notation" | "tracker" | "audio" | "project";

export const WRITABLE_EXPORT_FORMATS = [
  {
    id: "midi",
    extension: "mid",
    route: "notation",
    labelKey: "editor.midi",
    noteKey: "docs.formats.out.midi",
  },
  {
    id: "musicxml",
    extension: "musicxml",
    route: "notation",
    labelKey: "editor.musicXml",
    noteKey: "docs.formats.out.musicxml",
  },
  {
    id: "xm",
    extension: "xm",
    route: "tracker",
    labelKey: "editor.xmModule",
    noteKey: "docs.formats.out.tracker",
  },
  {
    id: "wav",
    extension: "wav",
    route: "audio",
    labelKey: "editor.audioWav",
    noteKey: "docs.formats.out.wav",
  },
  {
    id: "mp3",
    extension: "mp3",
    route: "audio",
    labelKey: "editor.audioMp3",
    noteKey: "docs.formats.out.mp3",
  },
  {
    id: "project",
    /*
      The document's own extension. This said `json` — the web's old export —
      long after both apps had moved to `.moo`, so each overrode the plan by
      hand and the docs table went on calling a project file JSON. The file is
      still JSON inside; the name is what the platform uses to hand it back to
      this app.
    */
    extension: DOCUMENT_EXTENSION,
    route: "project",
    labelKey: "editor.projectJson",
    noteKey: "docs.formats.out.project",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  extension: string;
  route: ExportRoute;
  labelKey: string;
  noteKey: string;
}>;

export type WritableExportFormat = (typeof WRITABLE_EXPORT_FORMATS)[number];
export type ExportFormatId = WritableExportFormat["id"];

/** Which tracks an export covers; see `exportScopeNeedsPrompt` for when to ask. */
export type ExportScope = "all" | "visible";

export type ExportPlan = {
  format: ExportFormatId;
  extension: string;
  route: ExportRoute;
  /** The score to write — already narrowed to the scope. */
  target: Score;
  /**
   * What the file is named after: the score's own title, not a project or
   * document name. Hand it to `exportFilename`, which keeps it and replaces
   * only the characters a filesystem refuses.
   */
  title: string;
};
