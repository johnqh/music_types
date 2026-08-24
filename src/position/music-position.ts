/**
 * The one place that knows where playback is.
 *
 * **The first stateful singleton service in music_types, and deliberately so.**
 * This package is otherwise model and primitives. The playhead earns the
 * exception because it has exactly one writer — `@sudobility/music_player` —
 * and readers in every other package: the caret, the note highlighting and the
 * piano keyboard. Any other home creates a dependency edge that exists only to
 * reach it. It still obeys the four rules this package keeps: it works on both
 * the frontend and the backend, adds no dependency, contains no hooks and
 * contains no async code.
 *
 * Implements `IMusicPosition` — see that interface for why this exists at all.
 * The short version: the caret, the note highlighting and the piano keyboard
 * used to derive the playhead three different ways and drifted apart under
 * load. Now they read one number.
 *
 * **The smoothing lives here, not in the caret.** That is the load-bearing
 * decision. The engine reports position about thirty times a second, and those
 * reports arrive in clumps because they come off the audio scheduler's
 * lookahead loop rather than a wall clock — driving anything straight off them
 * leaves it stalled on most frames and jumping when it does move. So the
 * playhead is dead-reckoned forward from the last report, and because that
 * happens *inside the single source of truth*, every consumer that asks gets
 * the same smoothed answer at the same instant. When the caret did its own
 * dead-reckoning, it was smoothing a number nobody else was smoothing.
 *
 * The anchor is the engine's own clock reading, not `performance.now()` at the
 * moment the report was handled. Anchoring on receipt folds event-loop latency
 * into the playhead: under load the anchor is stamped late and everything
 * derived from it lags the audio, which is exactly the drift this replaces.
 */
import type {
  IMusicPositionSource,
  UnsubscribePosition,
} from "../model/position.js";

/**
 * How far the playhead may be projected past its last report.
 *
 * Dead reckoning is an interpolation between reports, not a substitute for
 * them. Reports arrive about thirty times a second and in clumps, so the bound
 * has to absorb a clump — but past that, continuing to advance is asserting a
 * position nothing has corroborated.
 *
 * That distinction is not academic: when the engine's own report throttle
 * silenced it, this projected on regardless and the caret glided the length of
 * the score while every consumer of the *reported* tick — the scroll, the
 * bar/beat readout, the scrubber — sat at bar one. One writer, but two
 * behaviours, and they disagreed by the whole piece. Bounded, a stalled
 * producer stops the playhead everywhere at once, which reads as the one fault
 * it is instead of as a caret that works and a page that does not.
 *
 * Half a second is roughly fifteen missed reports: far beyond any clump, far
 * short of anything a reader would call motion.
 */
const MAX_PROJECTION_SECONDS = 0.5;

/** Wall-clock seconds, monotonic where the platform offers it. */
function nowSeconds(): number {
  return typeof performance !== "undefined"
    ? performance.now() / 1000
    : Date.now() / 1000;
}

export class MusicPosition implements IMusicPositionSource {
  private readonly listeners = new Set<(tick: number) => void>();
  /** Kept apart from `listeners`: the transport follows these and must not follow its own reports. */
  private readonly moveListeners = new Set<(tick: number) => void>();

  /** The last authoritative report, and the clock reading it belongs to. */
  private anchorTick = 0;
  private anchorSeconds = nowSeconds();

  private playing = false;
  private ticksPerSecond = 0;

  get isPlaying(): boolean {
    return this.playing;
  }

  /**
   * The playhead now.
   *
   * While stopped this is exactly the last reported tick — a paused caret must
   * not creep. While playing it is the last report projected forward by the
   * time since it was taken, which is what makes motion even however unevenly
   * the reports land.
   */
  get tick(): number {
    if (!this.playing || this.ticksPerSecond <= 0) return this.anchorTick;
    // Capped: see `MAX_PROJECTION_SECONDS`. Past the bound the playhead holds
    // its last corroborated position rather than inventing motion.
    const elapsed = Math.min(
      nowSeconds() - this.anchorSeconds,
      MAX_PROJECTION_SECONDS,
    );
    // Never backwards: a report that arrives late would otherwise pull the
    // playhead back a few ticks, which reads as a stutter.
    return Math.max(
      this.anchorTick,
      this.anchorTick + elapsed * this.ticksPerSecond,
    );
  }

  /**
   * The last vouched-for position: the last report, or the position banked
   * when the transport last changed state. `tick` projects from exactly this,
   * so the two cannot describe different moments.
   */
  get reportedTick(): number {
    return this.anchorTick;
  }

  report(tick: number, atSeconds?: number): void {
    this.anchorTick = tick;
    this.anchorSeconds = atSeconds ?? nowSeconds();
    for (const listener of this.listeners) listener(tick);
  }

  /**
   * Somebody moved the playhead.
   *
   * Anchors exactly as `report` does — the position *is* here now, and a
   * projection from the old anchor would glide away from it — then tells the
   * ordinary subscribers, so anything drawing the caret sees one number change
   * whoever moved it, and finally the movement subscribers, which is how the
   * transport learns to follow.
   */
  moveTo(tick: number): void {
    const target = Math.max(0, tick);
    this.anchorTick = target;
    this.anchorSeconds = nowSeconds();
    for (const listener of this.listeners) listener(target);
    for (const listener of this.moveListeners) listener(target);
  }

  subscribeToMoves(listener: (tick: number) => void): UnsubscribePosition {
    this.moveListeners.add(listener);
    return () => this.moveListeners.delete(listener);
  }

  /**
   * Update the tick rate without disturbing the anchor.
   *
   * Deliberately not folded into `report`: re-anchoring is `report`'s job and
   * a rate change must not do it, or a tempo change mid-bar would restart the
   * projection from wherever the last report left off.
   */
  setRate(ticksPerSecond: number): void {
    this.ticksPerSecond = Math.max(0, ticksPerSecond);
  }

  setPlaying(playing: boolean, ticksPerSecond?: number): void {
    // Re-anchor on the transition, or the first `tick` read after resuming
    // would project forward from however long the transport sat paused.
    if (playing !== this.playing) {
      this.anchorTick = this.tick;
      this.anchorSeconds = nowSeconds();
    }
    this.playing = playing;
    if (ticksPerSecond !== undefined) this.ticksPerSecond = ticksPerSecond;
    for (const listener of this.listeners) listener(this.anchorTick);
  }

  subscribe(listener: (tick: number) => void): UnsubscribePosition {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
