import { describe, expect, it } from "vitest";
import { ORIENTATION_OPTIONS, PAPER_OPTIONS, PAPER_SIZES } from "./print.js";

describe("paper and orientation options", () => {
  it("lists every paper once, with a label key and the CSS size keyword", () => {
    expect(PAPER_OPTIONS.map((o) => o.value)).toEqual([...PAPER_SIZES]);
    expect(PAPER_OPTIONS.find((o) => o.value === "a4")).toEqual({
      value: "a4",
      labelKey: "print.paperA4",
      css: "A4",
    });
    expect(PAPER_OPTIONS.find((o) => o.value === "letter")?.css).toBe(
      "letter",
    );
  });

  it("lists portrait first", () => {
    expect(ORIENTATION_OPTIONS).toEqual([
      { value: "portrait", labelKey: "print.portrait" },
      { value: "landscape", labelKey: "print.landscape" },
    ]);
  });
});
