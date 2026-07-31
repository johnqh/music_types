/**
 * Playback engine contract.
 *
 * Lives here rather than in music_lib because the implementations live in
 * music_io and both sides need the type without either depending on the other.
 * The concrete engines (Tone on web, react-native-audio-api on RN) are the only
 * things that import an audio library; everything that depends on playback
 * depends on this file instead, so the engine stays swappable and mockable.
 */
import type { Score, ScoreRange } from '../index.js';

export type TransportPlaybackState = 'stopped' | 'playing' | 'paused';

/**
 * Callbacks the engine invokes as playback advances. `onPositionTick` fires at
 * roughly 30Hz while playing; `onActiveNotes` fires whenever the set of
 * currently-sounding note ids changes; `onStateChange` fires on every
 * play/pause/stop transition, including ones the engine itself initiates.
 */
export type PlaybackObserver = {
  onPositionTick(tick: number): void;
  onActiveNotes(noteIds: string[]): void;
  onStateChange(state: TransportPlaybackState): void;
};

export interface PlaybackEngine {
  initialize(): Promise<void>;
  loadScore(score: Score): Promise<void>;
  play(fromTick?: number): Promise<void>;
  pause(): void;
  stop(): void;
  seek(tick: number): void;
  setTempoMultiplier(multiplier: number): void;
  setLoop(range: ScoreRange | null): void;
  setTrackMute(trackId: string, muted: boolean): void;
  setTrackSolo(trackId: string, solo: boolean): void;
  /** Toggles the metronome click. */
  setMetronome(enabled: boolean): void;
  /** Sets overall output level, 0-1 linear gain. */
  setMasterVolume(volume: number): void;
  /** Registers (or, with `null`, clears) the single observer receiving position/active-note/state updates. */
  setObserver(observer: PlaybackObserver | null): void;
  dispose(): void;
}
