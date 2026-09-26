/**
 * A document, as vocabulary: where its bytes live and whether they are
 * written. The per-document store and the saver are music_lib's.
 */
import type { ProjectCreateOrigin } from "../../model/api";
import { importFormatForFileName } from "./formats";

/** Where a document's bytes live, and therefore what saving it means. */
export type DocumentOrigin =
  | { kind: "unsaved" }
  | { kind: "file"; uri: string }
  | { kind: "project"; projectId: string };

/**
 * What a local document says about itself when it becomes a project.
 *
 * A document opened from a file is an import of that file, in the format its
 * extension names; one that was never saved anywhere started from nothing.
 * A document that already is a project has no create to describe, and answers
 * blank for want of anything truer. One rule for both apps' "sync to server",
 * so the same file does not read as an import in one and a blank in the other.
 */
export function projectOriginForDocument(
  origin: DocumentOrigin,
): ProjectCreateOrigin {
  if (origin.kind !== "file") return { kind: "blank" };
  const fileName = origin.uri.split("/").pop() ?? "";
  const format = importFormatForFileName(fileName);
  if (!format) return { kind: "blank" };
  return { kind: "imported", format, ...(fileName ? { fileName } : {}) };
}

/** Whether the document on screen is the one written. */
export type SaveState = "saved" | "saving" | "unsaved";
