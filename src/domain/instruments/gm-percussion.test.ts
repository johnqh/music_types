import { describe, expect, it } from 'vitest';
import {
  GM_PERCUSSION,
  GM_PERCUSSION_RANGE,
  gmPercussion,
  gmPercussionName,
} from './gm-percussion.js';

describe('gmPercussion', () => {
  it('covers every note in the General MIDI percussion range, with no gaps', () => {
    // A gap is a key on the keyboard that sounds a drum and cannot say which.
    const covered = GM_PERCUSSION.map(d => d.midi);
    const expected = [];
    for (
      let midi = GM_PERCUSSION_RANGE.min;
      midi <= GM_PERCUSSION_RANGE.max;
      midi += 1
    ) {
      expected.push(midi);
    }
    expect(covered).toEqual(expected);
  });

  /**
   * The case that cross-checked this table against the VexFlow percussion
   * mapping now lives in `music_lib`, with the renderer it is about: this
   * package holds the General MIDI data and must not reach a drawing layer.
   */
  it('gives every drum a key cap short enough to be one', () => {
    // Seven characters is what fits between two keys: the keyboard labels one
    // row of whites and one of blacks, and within a row the labels sit one
    // white key apart. Longer than this and neighbouring drums run together.
    for (const drum of GM_PERCUSSION) {
      expect(
        drum.short.length,
        `${drum.name} -> "${drum.short}"`
      ).toBeLessThanOrEqual(7);
      expect(drum.short.length).toBeGreaterThan(0);
    }
  });

  it('says the note number outside the range rather than inventing a pitch', () => {
    // "C8" would suggest something is going to sound there. Nothing is.
    expect(gmPercussion(34)).toBeNull();
    expect(gmPercussionName(34)).toBe('Note 34');
    expect(gmPercussionName(38)).toBe('Acoustic Snare');
  });
});
