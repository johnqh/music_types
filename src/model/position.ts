/**
 * Where playback is, as one number that everything reads.
 *
 * The editor has three things that follow the music — the caret, the note
 * highlighting, and the piano keyboard — and they used to learn about it
 * separately. The engine published a throttled `positionTick` on one channel
 * and the sounding set on another, and the caret then *re-derived* its own
 * position by dead-reckoning against `performance.now()` from whenever React
 * happened to process the last report. Three consumers, three clocks: under
 * load the caret's anchor was stamped late and drifted against notes that had
 * lit up on the audio clock, so the three visibly disagreed.
 *
 * This is the interface that removes the possibility. One implementation owns
 * the current tick — including the smoothing that keeps a caret gliding
 * between engine reports — and playback *writes* it while everything that
 * follows the music *reads* it. Two views of one number cannot disagree; three
 * derivations of three numbers eventually will.
 *
 * Deliberately not a store slice: the value changes ~30 times a second and
 * routing it through Zustand notifies every subscriber in the app at that rate,
 * which is the cost the playback bus was built to avoid.
 */

/** Detaches a listener registered with {@link IMusicPosition.subscribe}. */
export type UnsubscribePosition = () => void;

/**
 * The playhead, in **score ticks**.
 *
 * Score ticks, not performance ticks: repeats and jumps mean a bar can be
 * played more than once, and every consumer here draws or highlights something
 * on the page, where a bar exists exactly once. The translation happens at the
 * transport boundary so nothing downstream has to know repeats exist.
 */
export interface IMusicPosition {
  /**
   * The current tick.
   *
   * Read this rather than remembering the last value from `subscribe`: an
   * implementation may smooth between engine reports, in which case this is
   * fresher than the last event and is the number the caret should draw at.
   */
  readonly tick: number;

  /**
   * The last position the transport actually vouched for.
   *
   * Exposed beside {@link tick} deliberately: a smoothed playhead and the
   * report it was projected from are both wanted — a caret glides, while a
   * scrubber, a bar/beat readout or a scroll that follows the music wants the
   * position something corroborated. Keeping the pair on one implementation is
   * what stops them drifting; when the bus kept its own copy of the report and
   * the playhead projected from another, a producer that stopped reporting
   * left the caret gliding the length of the score while everything reading
   * the copy sat at bar one.
   *
   * "Vouched for" rather than "reported": the transport also banks a position
   * when it starts or stops, and that is equally authoritative.
   */
  readonly reportedTick: number;

  /** Whether the transport is advancing, which is when smoothing applies. */
  readonly isPlaying: boolean;

  /**
   * Observe changes.
   *
   * Fires when the underlying position is *reported*, not once per animation
   * frame — a consumer that paints every frame should read {@link tick} in its
   * own loop rather than expect an event per frame.
   */
  subscribe(listener: (tick: number) => void): UnsubscribePosition;
}

/**
 * The writable side, held by whatever is driving playback.
 *
 * Split from the read interface so the split is visible in a signature: the
 * transport takes this, and everything that merely follows the music takes
 * {@link IMusicPosition} and cannot move the playhead by accident.
 */
export interface IMusicPositionSource extends IMusicPosition {
  /**
   * Report an authoritative position, in score ticks.
   *
   * `atSeconds` is the *engine's own* clock reading for this position, not the
   * wall clock at the moment the report is handled. That distinction is the
   * whole point: anchoring on receipt time folds event-loop latency into the
   * playhead, which is what made the caret drift under load.
   */
  report(tick: number, atSeconds?: number): void;

  /** Start or stop smoothing, and set the rate ticks advance at. */
  setPlaying(playing: boolean, ticksPerSecond?: number): void;

  /**
   * How fast ticks are passing right now.
   *
   * Separate from `setPlaying` because it changes *during* playback and must
   * not re-anchor when it does: a score can slow into a fermata or change
   * tempo at a rehearsal mark, and the projection between reports has to use
   * the rate in force at that moment or the playhead glides past the hold.
   */
  setRate(ticksPerSecond: number): void;
}
