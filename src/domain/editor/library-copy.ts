/**
 * The words the frontend libraries need, as contracts a host fills in.
 *
 * No library in this family holds strings in any language. Each app hands over
 * its sentences — music_lib's `createLibraryCopy(t)` builds every table from a
 * translate function — and these are the shapes of those tables.
 */
import type { SelectionSummaryCopy } from "../selection/selection.js";
import type { MusicXmlWarnings } from "../../formats/musicxml.js";
import type { TemplateCopy } from "../documents/templates.js";
import type { EditingCopy } from "./editing-copy.js";

/**
 * The messages music_lib raises from long-lived internals — an autosave, the
 * playback adapter, a signed-out call.
 *
 * **Every entry is a function, resolved at the moment the message is needed.**
 * They used to be plain strings, captured when the host called
 * `setLibraryMessages` — which strands whatever language was loaded at
 * start-up, so a reader who switches to Chinese goes on getting English
 * toasts. `EditingCopy` already learned this and passes `commandLabel` as a
 * resolver for the same reason. The shape stays an object with a field per
 * message rather than a single `(key) => string`, because a record fails to
 * compile when a member is added and a resolver silently goes on answering for
 * the old set.
 */
export type LibraryMessages = {
  /** Action label on a retryable error toast. */
  retry: () => string;
  /** Autosave to the server failed; the change is still held locally. */
  saveFailed: () => string;
  /** The transport could not start. */
  playbackFailed: () => string;
  /** The score could not be handed to the playback engine. */
  scoreLoadFailed: () => string;
  /** An authenticated call was attempted while signed out. */
  authRequired: () => string;
  /**
   * A server-backed feature was reached on a host that has no server.
   *
   * Distinct from `authRequired`, which means "sign in and this works". This
   * one means the feature is not on offer here at all — a native app editing a
   * local file. A host whose UI asks `serverAvailable` first should never show
   * it; it is the backstop for the paths that do not.
   */
  serverUnavailable: () => string;
};

export type LibraryMessageKey = keyof LibraryMessages;

/** Every copy table the libraries read, each resolved when it is used. */
export type LibraryCopy = {
  /** For `setEditingCopy`: undo labels, validation, refusals. */
  editing: () => EditingCopy;
  /** For `selectionSummaryLabel`. */
  selection: () => SelectionSummaryCopy;
  /** For `openMusicXml`: one sentence per case the importer warns about. */
  musicXmlWarnings: () => MusicXmlWarnings;
  /** For `setLibraryMessages`: the messages raised from long-lived internals. */
  library: () => LibraryMessages;
  /** For `projectTemplates`: each template's name and description. */
  templates: () => TemplateCopy;
};
