/**
 * Saving a generated file.
 *
 * Takes bytes or text, never a `Blob`: `Blob` is a web concept, and putting it
 * in the signature would leak the browser into every React Native call site.
 */
export interface FileExporter {
  /** Web downloads the file; React Native writes it and opens the share sheet. */
  save(
    name: string,
    data: Uint8Array | string,
    mimeType: string,
  ): Promise<void>;
}
