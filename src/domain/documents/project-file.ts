/**
 * The project file, as vocabulary: what it is called, which version this build
 * writes, and its shape.
 *
 * Declared here rather than beside the parser in music_codecs, because these
 * are facts other packages read without needing to parse anything. The export
 * formats and the docs formats table beside this module name the file, the apps
 * pick files by extension, and a package that only wants the word `moo` must
 * not have to depend on a codec to get it — music_editing briefly did, while it
 * held the export menu and the formats table, which is how a package for
 * editing came to import the file-format layer. The serializer and
 * the parser stay in music_codecs; the words and the types they read and write
 * are the model's.
 */
import type { Score } from "../../index";

/** The format version this build writes and the newest it reads. */
export const PROJECT_FILE_VERSION = 1;

/** What the apps write. */
export const DOCUMENT_EXTENSION = "moo";

/**
 * What the apps open: their own extension, the longer one documents were
 * saved under before it was shortened, and the web's `.json` project export.
 */
export const DOCUMENT_EXTENSIONS = [
  DOCUMENT_EXTENSION,
  "moosiac",
  "json",
] as const;

/** A project file as it is written: the score, plus its title. */
export type ProjectFile = {
  version: number;
  title: string;
  score: Score;
};

/** Why a project file could not be read, for an app to word. */
export type ProjectFileErrorReason =
  | "invalidJson"
  | "notAProject"
  | "newerVersion"
  | "invalidScore";
