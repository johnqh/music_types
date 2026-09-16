/**
 * The transport settings a store keeps beside a player, and how binding one
 * can fail — as vocabulary. The binder itself (`bindPlayer`) and the defaults
 * are music_lib's.
 */
import type { ScoreRange } from "../../model/score.js";
import type { PlaybackLoadState } from "../../platform/playback.js";

/**
 * Transport settings the binder keeps in the store beside the player.
 *
 * In the store so a transport bar can render them; beside the player because
 * the player is what obeys them. **Optional on an editing store**: music_lib's
 * playback slice and its document store carry all five, while a bare editing
 * store carries none — the binder writes them into whichever store it is
 * given.
 */
export type TransportSettings = {
  loopRange: ScoreRange | null;
  tempoMultiplier: number;
  metronome: boolean;
  masterVolume: number;
  synthLoad: PlaybackLoadState;
};

/**
 * What went wrong binding a player, as a kind rather than a sentence — no
 * library holds words. The host turns it into its own toast.
 */
export type PlayerFailure = "scoreLoadFailed" | "playbackFailed";
