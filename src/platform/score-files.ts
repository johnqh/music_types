/**
 * The file layer above the codecs, as a contract.
 *
 * `@sudobility/music_codecs` turns bytes into a `Score` and back; an
 * implementation of this turns *files* into a `Score` and back — read bytes,
 * call the codec, hand over a score; take a score, call the codec, write the
 * file. `@sudobility/music_io` implements it (`createScoreFiles`) and exposes
 * it on its `MusicIo` bundle.
 *
 * **`open*`/`save*`, never `import*`/`export*`.** music_codecs already exports
 * `importMidi`/`exportMidi`; two identically-named functions in packages an app
 * imports together is a collision that gets resolved wrongly under time
 * pressure.
 *
 * **Audio is deliberately asymmetric with the score formats.** `saveAudio`
 * takes PCM the caller already rendered, because rendering is a live synth in
 * `@sudobility/music_player` and the file layer never holds a reference to one.
 */
import type { Score } from "../model/score";
import type { TrackerModule } from "../formats/mod";
import type {
  MidiImportOptions,
  MidiImportResult,
  MidiSummary,
} from "../formats/midi-import";
import type {
  MusicXmlImportResult,
  MusicXmlWarnings,
} from "../formats/musicxml";

export type ScoreFiles = {
  openMidi(bytes: ArrayBuffer, options: MidiImportOptions): MidiImportResult;
  analyzeMidi(bytes: ArrayBuffer): MidiSummary;
  openTracker(bytes: ArrayBuffer): { module: TrackerModule; score: Score };
  openMusicXml(
    text: string,
    warnings: MusicXmlWarnings,
  ): Promise<MusicXmlImportResult>;

  saveMidi(score: Score, filename: string): Promise<void>;
  saveTracker(module: TrackerModule, filename: string): Promise<void>;
  saveMusicXml(score: Score, filename: string): Promise<void>;
  saveAudio(
    samples: Float32Array,
    sampleRate: number,
    format: "wav" | "mp3",
    filename: string,
  ): Promise<void>;
};
