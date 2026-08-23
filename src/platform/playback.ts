/**
 * Playback engine contract.
 *
 * Lives here rather than in music_lib because the implementations live in
 * music_io and both sides need the type without either depending on the other.
 * The concrete engines (Tone on web, react-native-audio-api on RN) are the only
 * things that import an audio library; everything that depends on playback
 * depends on this file instead, so the engine stays swappable and mockable.
 */
import type { RenderTrack } from "./audio.js";

export type TransportPlaybackState = "stopped" | "playing" | "paused";

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
/** A stretch of written music, placed at a point in performance time. */
export type TimelineSegment = {
  performanceTick: number;
  sourceTick: number;
  durationTicks: number;
};

/**
 * How performance time maps back onto the written score.
 *
 * A repeat makes the two differ: bar 3 played twice has two performance
 * positions and one written position. Everything that *draws* a position —
 * the caret, the following-scroll, the bar/beat readout — translates through
 * this, so the score stays the canonical written thing and only the plan
 * knows about expansion.
 *
 * A score with no repeats yields one identity segment, which is what keeps
 * every existing behaviour unchanged.
 */
export type PerformanceTimeline = {
  segments: readonly TimelineSegment[];
  durationTicks: number;
};

/**
 * The engine contract — `PlaybackEngine`, `PlaybackObserver` and
 * `AuditionVoice` — lives in `@sudobility/music_player`, which is the only
 * thing that implements it.
 *
 * The *plan* stays here, and must: `PlaybackPlan` composes `PerformanceTimeline`,
 * which `performanceTimeline()` in `domain/score/` produces. Moving it would
 * make this package import from music_player.
 */
export type PlaybackPlan = {
  tracks: readonly PlaybackTrack[];
  notes: readonly PlaybackNote[];
  clicks: readonly MetronomeClick[];
  tempo: TempoConversion;
  /** Written-to-performed mapping; identity when nothing repeats. */
  timeline: PerformanceTimeline;
  /** The last tick any note ends on, in performance time. */
  durationTicks: number;
};

export type PlaybackLoadState =
  | { status: "idle" }
  | { status: "loading"; fraction: number | null }
  | { status: "ready" }
  | { status: "failed"; message: string };

