/**
 * Playback engine contract.
 *
 * Lives here rather than in music_lib because the implementations live in
 * music_io and both sides need the type without either depending on the other.
 * The concrete engines (Tone on web, react-native-audio-api on RN) are the only
 * things that import an audio library; everything that depends on playback
 * depends on this file instead, so the engine stays swappable and mockable.
 */
import type { ScoreRange } from '../index.js';
import type { RenderTrack } from './audio.js';

export type TransportPlaybackState = 'stopped' | 'playing' | 'paused';

/**
 * Callbacks the engine invokes as playback advances. `onPositionTick` fires at
 * roughly 30Hz while playing; `onActiveNotes` fires whenever the set of
 * currently-sounding note ids changes; `onStateChange` fires on every
 * play/pause/stop transition, including ones the engine itself initiates.
 */
export type SoundingNote = {
  /** The `NoteEvent.id` this voice came from, for notation highlighting. */
  noteId: string;
  /** Which track it is on, so a consumer can filter without searching the score. */
  trackId: string;
  /** Its sounding MIDI pitch, so a keyboard can light a key without resolving the event. */
  midi: number;
};

export type PlaybackObserver = {
  onPositionTick(tick: number): void;
  /**
   * The notes currently sounding, whenever that set changes.
   *
   * Resolved rather than bare ids. The scheduler already knows each note's
   * track and pitch — it scheduled them — and emitting only the id forced every
   * consumer to search the whole score to get it back: `playingPitchesForTrack`
   * was an O(score) scan per sounding note, twenty times a second.
   */
  onActiveNotes(notes: SoundingNote[]): void;
  onStateChange(state: TransportPlaybackState): void;
  /**
   * How far along the engine is in becoming able to make a sound.
   *
   * Optional because not every engine has anything to load. The soundfont
   * engine does: tens of megabytes to fetch and several seconds for the synth
   * to digest, all on the first press of Play. Without this the transport
   * simply looks broken for that whole time — which is exactly how it read
   * before there was anywhere to report it.
   */
  onLoadStateChange?(state: PlaybackLoadState): void;
};

/**
 * The engine's readiness to play, for a progress indicator.
 *
 * `fraction` is null while the work has no measurable progress — the synth
 * digesting a soundfont reports nothing until it is done — so a caller can tell
 * a real percentage from "busy, no idea how long".
 */
/**
 * Tick <-> second conversion, as playback needs it.
 *
 * An interface rather than a class so music_io can convert without importing
 * music_lib's `TempoMap` — which satisfies this structurally, so music_lib
 * passes the instance it already builds and no conversion code moves or is
 * duplicated.
 */
export interface TempoConversion {
  ticksToSeconds(tick: number): number;
  secondsToTicks(seconds: number): number;
}

/**
 * A track as playback needs it: the offline render's track plus the two mix
 * flags a live mix can change without reloading, plus the resolved GM voice.
 *
 * The resolved GM voice lives on `RenderTrack` itself, since the offline
 * renderer needs it for exactly the same reason.
 */
export type PlaybackTrack = RenderTrack & {
  muted: boolean;
  solo: boolean;
};

/**
 * A voice to audition, resolved from the GM tables **by the caller**.
 *
 * The engine cannot resolve it: a percussion voice's program addresses a drum
 * kit, and only the GM tables know which kit an arbitrary address falls in.
 * Resolving here is what lets the platform layer keep no catalogue of its own.
 */
export type AuditionVoice = {
  /** The kit's program on a percussion voice, the instrument's own otherwise. */
  program: number;
  /** The GM catalogue name for `program`. */
  name: string;
  isPercussion: boolean;
};

/** One playback-ready note, in score ticks, carrying the ids playback reports back. */
export type PlaybackNote = {
  tick: number;
  durTicks: number;
  midi: number;
  velocity: number;
  trackId: string;
  noteId: string;
};

/** One metronome click. `accent` marks beat 1 of its measure. */
export type MetronomeClick = { tick: number; accent: boolean };

/**
 * Everything live playback needs, and nothing about a `Score`.
 *
 * The live counterpart of `RenderPlan`: music_lib decides every musical
 * question — ties joined, pitches resolved, mute and solo, the measure grid's
 * beat positions, the tempo — and the engine only schedules and sounds what it
 * is handed. This is the seam that keeps music_io free of the domain.
 */
export type PlaybackPlan = {
  tracks: readonly PlaybackTrack[];
  notes: readonly PlaybackNote[];
  clicks: readonly MetronomeClick[];
  tempo: TempoConversion;
  /** The last tick any note ends on. */
  durationTicks: number;
};

export type PlaybackLoadState =
  | { status: 'idle' }
  | { status: 'loading'; fraction: number | null }
  | { status: 'ready' }
  | { status: 'failed'; message: string };

export interface PlaybackEngine {
  initialize(): Promise<void>;
  /** Adopts a plan. The engine is handed music, never a score. */
  load(plan: PlaybackPlan): Promise<void>;
  play(fromTick?: number): Promise<void>;
  pause(): void;
  stop(): void;
  seek(tick: number): void;
  setTempoMultiplier(multiplier: number): void;
  setLoop(range: ScoreRange | null): void;
  setTrackMute(trackId: string, muted: boolean): void;
  setTrackSolo(trackId: string, solo: boolean): void;
  /**
   * Re-reads every track's volume, pan, mute and solo and pushes them,
   * touching nothing that is scheduled.
   *
   * The mixing counterpart to `load`. Mute and solo had setters; volume and pan
   * did not, and a track's volume was only ever read at load time — so once a
   * mix change stopped reloading the score (the playback edit lock, see
   * `music_lib`'s `score-slice`), moving a fader during playback moved the
   * fader and not the sound.
   *
   * Takes only the tracks, so changing a gain does not rebuild every note —
   * which is the whole reason this is separate from `load`. Idempotent, and
   * takes them all rather than one property: the caller says "the mix changed,
   * here it is" and does not work out which property it was.
   */
  applyMix(tracks: readonly PlaybackTrack[]): void;
  /** Toggles the metronome click. */
  setMetronome(enabled: boolean): void;
  /** Sets overall output level, 0-1 linear gain. */
  setMasterVolume(volume: number): void;
  /**
   * Sounds `midi` immediately on `program`'s voice and holds it, independent of
   * the transport — for auditioning a key while editing.
   *
   * `voice.isPercussion` mirrors what playback does with a percussion-clef
   * track: without it, tapping a note on a drum track auditioned a pitched
   * instrument while the same note played back as a drum.
   *
   * Separate from `play` because the two answer different questions: `play`
   * renders the written score along a timeline, this makes a sound *now*, for
   * as long as the caller holds it, whether or not a score is even loaded.
   * Implementations must not disturb transport state.
   */
  noteOn(midi: number, voice: AuditionVoice): void;
  /** Releases a pitch started by `noteOn`. Silent no-op if it is not sounding. */
  noteOff(midi: number): void;
  /** Registers (or, with `null`, clears) the single observer receiving position/active-note/state updates. */
  setObserver(observer: PlaybackObserver | null): void;
  dispose(): void;
}
