import { describe, expect, it } from "vitest";
import type { MidiFile, XmlElement } from "./index.js";
import { XmlParseError } from "./index.js";

describe("platform interfaces", () => {
  it("XmlParseError is a real Error subclass, so callers can catch it by type", () => {
    const error = new XmlParseError("bad");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("XmlParseError");
    expect(error.message).toBe("bad");
  });

  it("is satisfied structurally by a DOM-shaped element", () => {
    // This package has no DOM lib on purpose -- it must stay platform-neutral --
    // so the live proof that a real `Element` satisfies XmlElement lives in
    // music_io's WebXmlParser, which returns `document.documentElement` typed as
    // XmlElement and therefore would not compile if it did not. What is checked
    // here is the shape that makes that possible: index-access collections
    // rather than DOM-specific collection types.
    const element: XmlElement = {
      tagName: "note",
      textContent: "C",
      children: { length: 0 },
      getAttribute: () => null,
      getElementsByTagName: () => ({ length: 0 }),
    };
    expect(element.tagName).toBe("note");
    expect(Array.from(element.children)).toEqual([]);
  });

  it("MidiFile keys controlChanges by CC number, as the importer looks them up", () => {
    const file: MidiFile = {
      header: { ppq: 480, tempos: [], timeSignatures: [] },
      tracks: [
        {
          name: "T",
          channel: 0,
          instrument: { number: 0 },
          notes: [],
          controlChanges: { 7: [{ number: 7, ticks: 0, value: 1 }] },
          durationTicks: 0,
          durationSeconds: 0,
        },
      ],
      duration: 0,
    };
    expect(file.tracks[0].controlChanges[7]?.[0].value).toBe(1);
  });

});
