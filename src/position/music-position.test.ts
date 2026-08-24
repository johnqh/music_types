/**
 * One playhead, read by everything that follows the music.
 *
 * The bug these exist for: the caret, the note highlighting and the piano
 * keyboard each derived the position their own way and visibly disagreed
 * during playback. The fix is not "fix the caret" — it is that there is now
 * one number, so two readers cannot differ.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { MusicPosition } from './music-position.js';
import {
  getMusicPosition,
  getMusicPositionSource,
  initializeMusicPosition,
  resetMusicPosition,
} from './singleton.js';

afterEach(() => {
  resetMusicPosition();
  vi.restoreAllMocks();
});

describe('MusicPosition', () => {
  it('reports exactly what it was told while stopped', () => {
    // A paused caret must not creep.
    const position = new MusicPosition();
    position.report(480);
    expect(position.tick).toBe(480);
    expect(position.tick).toBe(480);
  });

  it('projects forward while playing, so motion is even between reports', () => {
    const position = new MusicPosition();
    let now = 10;
    vi.spyOn(performance, 'now').mockImplementation(() => now * 1000);

    position.setPlaying(true, 960); // 960 ticks per second
    position.report(0, now);

    // Both sample points sit inside the projection bound; the point here is
    // that motion between reports is even, not how long it may run unaided.
    now = 10.25;
    expect(position.tick).toBeCloseTo(240, 0);
    now = 10.5;
    expect(position.tick).toBeCloseTo(480, 0);
  });

  /*
    Dead reckoning interpolates between reports; it does not replace them.

    When the engine's report throttle silenced it after a replay, this
    projected on regardless — the caret glided the length of the score while
    every consumer of the reported tick sat at bar one. One writer, two
    behaviours. Bounded, a stalled producer stops the playhead everywhere at
    once and the fault reads as the single thing it is.
  */
  it('stops projecting once its last report is too old to stand on', () => {
    const position = new MusicPosition();
    let now = 10;
    vi.spyOn(performance, 'now').mockImplementation(() => now * 1000);

    position.setPlaying(true, 960);
    position.report(0, now);

    now = 10.5;
    const atBound = position.tick;
    now = 30; // twenty seconds with nothing corroborating it
    expect(position.tick).toBe(atBound);
  });

  it('anchors on the engine’s clock, not on when the report was handled', () => {
    // The drift this replaces: anchoring on receipt folds event-loop latency
    // into the playhead, so under load everything derived from it lags the
    // audio while the sounding notes do not.
    const position = new MusicPosition();
    let now = 100;
    vi.spyOn(performance, 'now').mockImplementation(() => now * 1000);
    position.setPlaying(true, 960);

    // The engine sampled at t=100 but the report is handled 80ms late.
    now = 100.08;
    position.report(0, 100);

    // Half a second after the *sample*, the playhead is half a second along —
    // not half a second after the handler ran.
    now = 100.5;
    expect(position.tick).toBeCloseTo(480, 0);
  });

  it('never runs backwards', () => {
    const position = new MusicPosition();
    let now = 5;
    vi.spyOn(performance, 'now').mockImplementation(() => now * 1000);
    position.setPlaying(true, 960);
    position.report(1000, 5);

    now = 5.2;
    const ahead = position.tick;
    // A late report for an earlier sample must not pull the playhead back.
    position.report(1000, 5);
    expect(position.tick).toBeGreaterThanOrEqual(ahead - 1);
  });

  it('does not project across a pause', () => {
    const position = new MusicPosition();
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now * 1000);
    position.setPlaying(true, 960);
    position.report(0, 0);

    // Paused while the last report is still fresh enough to project from, so
    // what is banked is the projected position and not the bound.
    now = 0.5;
    position.setPlaying(false);
    now = 60; // a minute paused
    expect(position.tick).toBeCloseTo(480, 0);
  });

  it('tells every subscriber the same thing', () => {
    // The property the whole change is for.
    const position = new MusicPosition();
    const seen: number[][] = [[], []];
    position.subscribe(t => seen[0].push(t));
    position.subscribe(t => seen[1].push(t));

    position.report(120);
    position.report(240);

    expect(seen[0]).toEqual([120, 240]);
    expect(seen[1]).toEqual(seen[0]);
  });

  it('two readers of the singleton see one value at one instant', () => {
    const source = getMusicPositionSource();
    let now = 3;
    vi.spyOn(performance, 'now').mockImplementation(() => now * 1000);
    source.setPlaying(true, 960);
    source.report(0, 3);

    now = 3.25;
    // Whatever the smoothing produces, the caret and the keyboard read it
    // through the same getter and cannot disagree.
    expect(getMusicPosition().tick).toBe(getMusicPositionSource().tick);
  });

  it('unsubscribes cleanly', () => {
    const position = new MusicPosition();
    const heard: number[] = [];
    const off = position.subscribe(t => heard.push(t));
    position.report(1);
    off();
    position.report(2);
    expect(heard).toEqual([1]);
  });
});

describe('the singleton', () => {
  it('hands back the same instance', () => {
    expect(getMusicPosition()).toBe(getMusicPositionSource());
    expect(initializeMusicPosition()).toBe(getMusicPosition());
  });

  it('does not swap the instance if initialised twice', () => {
    // A re-mounting composition root must not pull the playhead out from
    // under everything already subscribed to it.
    const first = initializeMusicPosition();
    first.report(555);
    expect(initializeMusicPosition()).toBe(first);
    expect(getMusicPosition().tick).toBe(555);
  });

  it('reset gives a fresh one, so a suite cannot inherit a playhead', () => {
    const first = initializeMusicPosition();
    resetMusicPosition();
    expect(initializeMusicPosition()).not.toBe(first);
  });
});

describe('moving the playhead', () => {
  it('tells ordinary subscribers, so the caret sees one number change', () => {
    const position = new MusicPosition();
    const seen: number[] = [];
    position.subscribe((t) => seen.push(t));

    position.moveTo(960);

    expect(seen).toEqual([960]);
    expect(position.tick).toBe(960);
    expect(position.reportedTick).toBe(960);
  });

  it('tells movement subscribers, which is how the transport follows a seek', () => {
    const position = new MusicPosition();
    const moves: number[] = [];
    position.subscribeToMoves((t) => moves.push(t));

    position.moveTo(480);

    expect(moves).toEqual([480]);
  });

  it('never tells movement subscribers about its own reports', () => {
    // The loop this exists to prevent: a transport that followed its own
    // reports would seek to where it already is, thirty times a second.
    const position = new MusicPosition();
    const moves: number[] = [];
    position.subscribeToMoves((t) => moves.push(t));

    position.setPlaying(true, 960);
    position.report(480);
    position.report(960);

    expect(moves).toEqual([]);
  });

  it('re-anchors, so a moved playhead does not glide back to where it was', () => {
    let clock = 0;
    const position = new MusicPosition(() => clock);
    position.setPlaying(true, 1000);
    position.report(0, 0);

    clock = 0.1;
    position.moveTo(5000);
    // Projected from the move, not from the report it replaced.
    clock = 0.2;
    expect(position.tick).toBeGreaterThanOrEqual(5000);
    expect(position.tick).toBeLessThan(5200);
  });

  it('stops telling a listener that unsubscribed', () => {
    const position = new MusicPosition();
    const moves: number[] = [];
    const off = position.subscribeToMoves((t) => moves.push(t));
    off();

    position.moveTo(480);

    expect(moves).toEqual([]);
  });
});
