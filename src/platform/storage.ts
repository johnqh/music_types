/**
 * The storage a frontend store is handed, as structural contracts.
 *
 * Structural so each platform brings its own and a test brings a map: the web
 * passes `localStorage` behind @sudobility/di's `StorageService`, a sandboxed
 * macOS build reaches a file through a security-scoped bookmark — a different
 * storage, not a different document.
 */

/** Structural subset of @sudobility/di's StorageService used for device prefs. */
export type PrefsStorage = {
  getItem(
    key: string,
  ): Promise<string | null | undefined> | string | null | undefined;
  setItem(key: string, value: string): Promise<void> | void;
};

/** The filesystem, as far as a document needs one. */
export type DocumentFileStorage = {
  readText(uri: string): Promise<string>;
  writeText(uri: string, text: string): Promise<void>;
};
