/**
 * Every file format the app reads and writes, declared once.
 *
 * The documentation, and anything else that has to list them, reads this —
 * rather than a paragraph of prose naming formats, which is a copy of the list
 * that stops being true the first time a format is added.
 *
 * **Here because both apps document these formats**, and what this product
 * can open is a fact about the product, not about a web page. A table of
 * vocabulary rather than logic, so it sits with the rest of the vocabulary.
 *
 * Every description is an i18n key, so the prose lives in each host's locale
 * files and no library holds strings in any language.
 */
import { DOCUMENT_EXTENSIONS } from "./project-file.js";
import { WRITABLE_EXPORT_FORMATS } from "./export-formats.js";

export type FormatEntry = {
  id: string;
  /** Extensions as a reader would write them. */
  extensions: string;
  /** i18n key describing what survives the trip. */
  noteKey: string;
};

export const IMPORT_FORMATS: readonly FormatEntry[] = [
  { id: "midi", extensions: ".mid, .midi", noteKey: "docs.formats.in.midi" },
  {
    id: "musicxml",
    extensions: ".musicxml, .xml",
    noteKey: "docs.formats.in.musicxml",
  },
  {
    id: "tracker",
    extensions: ".mod, .dsm, .s3m, .xm, .it, .mptm",
    noteKey: "docs.formats.in.tracker",
  },
  {
    id: "audio",
    extensions: ".wav, .mp3, .mpa",
    noteKey: "docs.formats.in.audio",
  },
  /*
    Every extension a project file opens under — the `.moo` both apps write,
    the `.moosiac` documents were saved as before it was shortened, and the
    web's old `.json` export — read from the list the codec decides by, so the
    table cannot list fewer than the importer accepts.
  */
  {
    id: "project",
    extensions: DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(", "),
    noteKey: "docs.formats.in.project",
  },
];

/**
 * What the docs export table lists: every format the export menu writes, then
 * printing, which produces a document rather than a file.
 *
 * Derived from `WRITABLE_EXPORT_FORMATS` rather than written out beside it: the
 * table was its own list, and a list about the menu is a copy of the menu.
 */
export const EXPORT_FORMATS: readonly FormatEntry[] = [
  ...WRITABLE_EXPORT_FORMATS.map((format) => ({
    id: format.id,
    extensions: `.${format.extension}`,
    noteKey: format.noteKey,
  })),
  { id: "print", extensions: "—", noteKey: "docs.formats.out.print" },
];
