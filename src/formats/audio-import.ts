/**
 * What a recording import accepts.
 *
 * The file goes to the server, which separates and transcribes it — nothing is
 * decoded on the device — so these name the upload: which files to offer and
 * what MIME type each is sent as. Vocabulary only, and so declared here; the
 * helpers that read a file name (`audioMimeFor`, `isLongAudio`) are about
 * files and live in `@sudobility/music_io`.
 */

/** The formats offered by the file picker, which the transcriber decodes. */
export const AUDIO_IMPORT_EXTENSIONS = [
  "wav",
  "mp3",
  "mpa",
  "m4a",
  "aac",
] as const;
export type AudioImportExtension = (typeof AUDIO_IMPORT_EXTENSIONS)[number];

/** MIME types by extension. React Native will not infer one for an upload. */
export const AUDIO_MIME: Record<AudioImportExtension, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  mpa: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
};
