/**
 * A document, as vocabulary: where its bytes live and whether they are
 * written. The per-document store and the saver are music_lib's.
 */

/** Where a document's bytes live, and therefore what saving it means. */
export type DocumentOrigin =
  | { kind: "unsaved" }
  | { kind: "file"; uri: string }
  | { kind: "project"; projectId: string };

/** Whether the document on screen is the one written. */
export type SaveState = "saved" | "saving" | "unsaved";
