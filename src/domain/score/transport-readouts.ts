/**
 * The transport bar's readouts, as values.
 *
 * Both apps draw the same bar, and each had its own `formatTimecode`, its own
 * speed list and its own idea of where the score ends — which is where they
 * parted: the native bar measured to the end of the *first* track, so a score
 * whose second part ran longer showed a scrubber that stopped short of the
 * music. The web rule (the longest track, never less than one tick) is the one
 * stated here.
 */
import type { PlaybackLoadState } from "../../platform/playback";
import type { Score } from "../../index";
import { TempoMap } from "../time/tempo-map";
import { scoreEndTick } from "./queries";

/** Spec §22: "Speeds: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x." */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/**
 * `M:SS.d` — minutes, zero-padded seconds, tenths. The tenths are there on
 * purpose: they change about three times a second during playback, which makes
 * the actual playback rate visible against a wall clock.
 */
export function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const rest = clamped - minutes * 60;
  const whole = Math.floor(rest);
  const tenths = Math.floor((rest - whole) * 10);
  return `${minutes}:${String(whole).padStart(2, "0")}.${tenths}`;
}

/**
 * How far the transport can travel, in ticks and in seconds.
 *
 * To the end of the longest track, floored at one tick so a range control
 * always has a span to draw. Seconds through the score's own `TempoMap` — the
 * one playback schedules with — so the total agrees with what is heard. No
 * score is no extent.
 */
export function transportExtent(score: Score | null): {
  maxTick: number;
  totalSeconds: number;
} {
  if (!score) return { maxTick: 1, totalSeconds: 0 };
  const maxTick = Math.max(1, scoreEndTick(score));
  const tempoMap = new TempoMap(score.tempoMap, score.ppq);
  return { maxTick, totalSeconds: tempoMap.ticksToSeconds(maxTick) };
}

/**
 * The load indicator's percentage: whole, and only while downloading.
 *
 * `null` in every other state and while the synth digests the font, which
 * reports no fraction — a bar moving through that half would claim progress
 * the engine has not made.
 */
export function synthLoadPercent(load: PlaybackLoadState): number | null {
  if (load.status !== "loading" || load.fraction === null) return null;
  return Math.round(load.fraction * 100);
}
