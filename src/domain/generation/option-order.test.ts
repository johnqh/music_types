import { describe, expect, it } from "vitest";
import { sortOptionsByLabel } from "./option-order.js";

describe("sortOptionsByLabel", () => {
  it("orders values by their label, not by the value itself", () => {
    const labels: Record<string, string> = {
      electroSwing: "Electro Swing",
      waltz: "Waltz",
      ambient: "Ambient",
    };
    expect(
      sortOptionsByLabel(
        ["electroSwing", "waltz", "ambient"],
        (v) => labels[v] ?? v,
      ),
    ).toEqual(["ambient", "electroSwing", "waltz"]);
  });

  it("collates in the locale it is given rather than by code point", () => {
    // "Ä" sorts beside "A" in German and after "Z" by code point.
    const sorted = sortOptionsByLabel(
      ["z", "a-umlaut", "b"],
      (v) => ({ z: "Zeta", "a-umlaut": "Äpfel", b: "Beta" })[v] ?? v,
      "de",
    );
    expect(sorted).toEqual(["a-umlaut", "b", "z"]);
  });

  it("leaves the input array untouched", () => {
    const input = ["b", "a"] as const;
    sortOptionsByLabel(input, (v) => v);
    expect(input).toEqual(["b", "a"]);
  });

  it("returns an empty list for no options", () => {
    expect(sortOptionsByLabel([], (v) => v)).toEqual([]);
  });
});
