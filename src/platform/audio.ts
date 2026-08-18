/**
 * Platform-bound audio decoding and encoding.
 *
 * Web uses Web Audio, which already understands wav and mp3 (and therefore
 * `.mpa`, which is the same MPEG audio) — React Native will need something
 * else entirely, which is why this is an interface rather than a function.
 *
 * The *analysis* is deliberately not here: pitch tracking, segmentation and
 * tempo detection are pure functions over samples and live in music_lib, where
 * they can be tested with a synthesised tone and no browser.
 */

export type DecodedAudio = { samples: Float32Array; sampleRate: number };

export interface AudioCodec {
  /**
   * Decode `.wav`/`.mp3`/`.mpa` to **mono** PCM.
   *
   * Channels are mixed down rather than preserved: the analysis is monophonic,
   * so stereo would double the work for nothing.
   */
  decode(bytes: ArrayBuffer): Promise<DecodedAudio>;
  encodeWav(audio: DecodedAudio): ArrayBuffer;
  encodeMp3(audio: DecodedAudio): ArrayBuffer;
}

/**
 * One channel of an offline render — everything that decides how a track
 * sounds, as distinct from when its notes fall.
 *
 * Carries `midiProgram` and `instrumentName` rather than a resolved voice: the
 * renderer picks the voice, so it picks it by the same rule live playback does
 * and the two cannot drift apart.
 */
export type RenderTrack = {
  id: string;
  midiProgram: number;
  instrumentName: string;
  /** From the track's clef, matching how live playback decides. */
  isPercussion: boolean;
  /**
   * The GM program to voice this track from, resolved by music_lib: the kit's
   * program on a percussion track, the track's own otherwise.
   *
   * Resolved there because **a percussion track's `midiProgram` names a drum
   * kit, not an instrument** — Brush is 40 and program 40 is Violin — and only
   * the GM tables know which kit an arbitrary address falls in. Carrying the
   * answer is what lets the platform layer keep no catalogue of its own.
   */
  voiceProgram: number;
  /** The GM catalogue name for `voiceProgram` — the kit's name on a percussion track. */
  voiceName: string;
  /** 0..1 channel gain. */
  volume: number;
  /** -1..1. */
  pan: number;
};

/** One note to sound in an offline render, on the channel named by `trackId`. */
export type RenderEvent = {
  trackId: string;
  midi: number;
  startSec: number;
  durationSec: number;
  /** 0..1, as the synth voices expect. */
  velocity: number;
};

/**
 * Everything an offline render needs.
 *
 * `tracks` lists every track the score has, **including silent and muted
 * ones**, because the renderer's mix headroom is sized by how many channels
 * exist — exactly as live playback sizes it. Deriving that from the events
 * alone would open a muted-heavy score by a couple of dB against what was
 * heard.
 */
export type RenderPlan = {
  tracks: readonly RenderTrack[];
  events: readonly RenderEvent[];
  /** How long the rendered file must be, including the tail of the last note. */
  durationSec: number;
};

/**
 * Offline audio rendering — the platform-bound half of audio export.
 *
 * Takes a plan somebody else decided on (`renderEvents` in music_lib works out
 * mute, solo and timing), so everything musical stays testable without an
 * audio context and only the scheduling lives behind this interface.
 */
export interface AudioRenderer {
  render(plan: RenderPlan): Promise<DecodedAudio>;
}

/**
 * One note heard in a recording, in **seconds** — the raw output of an
 * analyser, before anything musical has been decided about it.
 *
 * Seconds rather than ticks on purpose: which tick a note lands on depends on
 * a tempo, and choosing a tempo is a musical judgement that belongs in
 * music_lib with the rest of them, not in the platform layer that owns the
 * model.
 */
export type HeardNote = {
  midi: number;
  startSec: number;
  durationSec: number;
  /** 0..1 — how loud the analyser thought it was, used for velocity. */
  amplitude: number;
};

export type TranscribeAudioOptions = {
  /** Reports analysis progress, 0..1. */
  onProgress?: (fraction: number) => void;
};

/**
 * Turning a recording into notes.
 *
 * Platform-bound because the only implementations worth having are machine
 * learning models, and those come with a platform's tensor runtime attached —
 * TensorFlow.js on the web, something else entirely on React Native. music_lib
 * stays free of all of it and keeps the part that is actually music: what
 * tempo those notes imply and which ticks they land on.
 *
 * **Polyphonic.** The pure fallback in music_lib (YIN) hears one line at a
 * time, which is why a chord used to import as a single note.
 */
export interface AudioTranscriber {
  transcribe(audio: DecodedAudio, options?: TranscribeAudioOptions): Promise<HeardNote[]>;
}
