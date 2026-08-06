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

/** One note to sound in an offline render. */
export type RenderEvent = {
  midi: number;
  startSec: number;
  durationSec: number;
  /** 0..1, as the synth voices expect. */
  velocity: number;
  midiProgram: number;
  isPercussion: boolean;
};

/**
 * Offline audio rendering — the platform-bound half of audio export.
 *
 * Takes events somebody else decided on (`renderEvents` in music_lib works out
 * mute, solo and timing), so everything musical stays testable without an
 * audio context and only the scheduling lives behind this interface.
 */
export interface AudioRenderer {
  render(events: readonly RenderEvent[], durationSec: number): Promise<DecodedAudio>;
}
