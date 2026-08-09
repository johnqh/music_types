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
