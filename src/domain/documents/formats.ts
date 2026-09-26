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
import { DOCUMENT_EXTENSIONS } from "./project-file";
import { WRITABLE_EXPORT_FORMATS } from "./export-formats";

export type FormatEntry = {
  id: string;
  /** Extensions as a reader would write them. */
  extensions: string;
  /** i18n key describing what survives the trip. */
  noteKey: string;
};

/**
 * The closed list of formats the importers read, as an array with the type
 * read off it: a `ProjectOrigin` records which one a project came in as, and
 * a value that must be *validated* needs the list at runtime.
 */
export const IMPORT_FORMAT_IDS = [
  "midi",
  "musicxml",
  "tracker",
  "audio",
  "project",
] as const;
export type ImportFormatId = (typeof IMPORT_FORMAT_IDS)[number];

export type ImportFormatEntry = FormatEntry & { id: ImportFormatId };

export const IMPORT_FORMATS: readonly ImportFormatEntry[] = [
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
 * Which import format a file name belongs to, by its extension, or null for
 * one no importer reads. How a document opened from a file records what it
 * was when it becomes a project — the table above is the one list of
 * extensions, so this cannot know fewer than the importers accept.
 */
export function importFormatForFileName(
  fileName: string,
): ImportFormatId | null {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return null;
  const extension = fileName.slice(dot).toLowerCase();
  const entry = IMPORT_FORMATS.find((format) =>
    format.extensions.split(",").some((ext) => ext.trim() === extension),
  );
  return entry?.id ?? null;
}

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
