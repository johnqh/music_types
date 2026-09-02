import { describe, expect, it } from "vitest";
import {
  rankTracksForGeneration,
  roleOf,
  roleOrderForStyle,
} from "./arrangement-order";

const track = (midiProgram: number, clef?: string) => ({ midiProgram, clef });

// Programs used below: 56 trumpet, 66 tenor sax, 25 steel guitar, 30 distortion
// guitar, 33 finger bass, 38 synth bass, 48 string ensemble, 89 warm pad.
describe("roleOf", () => {
  it("reads the role off the family, and a kit off the clef", () => {
    expect(roleOf(track(0, "percussion"))).toBe("drums");
    expect(roleOf(track(33))).toBe("bass");
    expect(roleOf(track(89))).toBe("harmony");
    expect(roleOf(track(48))).toBe("harmony");
    expect(roleOf(track(56))).toBe("lead");
  });

  /*
   * A drum kit's program is a KIT, not an instrument — program 0 on a
   * percussion track is the Standard Kit, and on a pitched one it is a grand
   * piano. Reading the clef first is what keeps a kit from being ranked as a
   * lead piano.
   */
  it("does not mistake a kit's program for an instrument", () => {
    expect(roleOf(track(0, "percussion"))).toBe("drums");
    expect(roleOf(track(0))).toBe("lead");
  });
});

describe("roleOrderForStyle", () => {
  it("writes the tune first by default", () => {
    expect(roleOrderForStyle(undefined)[0]).toBe("lead");
    expect(roleOrderForStyle("a bright waltz")[0]).toBe("lead");
  });

  /*
   * In these styles the bassline is the material rather than an accompaniment
   * to it — a reggae riddim is named and reused while melodies come and go —
   * so a melody written first would leave the bass following a tune instead of
   * stating the hook.
   */
  it("writes the bass first where the groove is the song", () => {
    for (const style of [
      "reggae — one drop, bass carries it",
      "funk with a tight horn section",
      "deep house",
      "boom-bap hip hop",
    ]) {
      expect(roleOrderForStyle(style)[0]).toBe("bass");
    }
  });

  it("locks the kit to the riff in riff-led styles", () => {
    const order = roleOrderForStyle("heavy metal — downtuned riffing");
    expect(order[0]).toBe("lead");
    // Above harmony, unlike the default order.
    expect(order.indexOf("drums")).toBeLessThan(order.indexOf("harmony"));
  });

  /*
   * "funk rock" is carried by its groove; matching the riff branch on the
   * second word would write the guitar before the bass and lose exactly the
   * thing the style is named for.
   */
  it("prefers the groove reading when a style names both", () => {
    expect(roleOrderForStyle("funk rock")[0]).toBe("bass");
  });
});

describe("rankTracksForGeneration", () => {
  const roster = [
    track(56), // 0 trumpet   — lead
    track(89), // 1 warm pad  — harmony
    track(38), // 2 synth bass— bass
    track(0, "percussion"), // 3 kit
  ];

  it("puts the tune first and the kit last by default", () => {
    expect(rankTracksForGeneration(roster)).toEqual([0, 2, 1, 3]);
  });

  it("puts the bass first in a groove-led style", () => {
    expect(rankTracksForGeneration(roster, "reggae")).toEqual([2, 3, 1, 0]);
  });

  /*
   * Stable within a role: a preset and a user both list the part they care
   * about first, so two leads keep the order they were given rather than being
   * reshuffled by a sort that had no opinion about them.
   */
  it("keeps roster order among parts sharing a role", () => {
    const twoLeads = [track(56), track(66), track(33)];
    expect(rankTracksForGeneration(twoLeads)).toEqual([0, 1, 2]);
  });

  it("returns every index exactly once", () => {
    const ranked = rankTracksForGeneration(roster, "funk");
    expect([...ranked].sort()).toEqual([0, 1, 2, 3]);
  });

  it("has nothing to say about an empty roster", () => {
    expect(rankTracksForGeneration([])).toEqual([]);
  });
});
