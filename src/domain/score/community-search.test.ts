import { describe, expect, it } from "vitest";
import { filterCommunity } from "./community-search.js";

const items = [
  { publicName: "Nocturne in E flat", publisherName: "Ada" },
  { publicName: "Study No. 3", publisherName: "Bo Chen" },
];

describe("filterCommunity", () => {
  it("returns everything for an empty query", () => {
    expect(filterCommunity(items, "")).toHaveLength(2);
    // Whitespace is not a search: somebody who typed a space and stopped has
    // not narrowed anything, and showing them nothing would look broken.
    expect(filterCommunity(items, "   ")).toHaveLength(2);
  });

  it("matches the title, case-insensitively and by substring", () => {
    expect(filterCommunity(items, "NOCTURNE")).toHaveLength(1);
    expect(filterCommunity(items, "flat")).toHaveLength(1);
  });

  it("matches the publisher too — it is on the row being read", () => {
    expect(filterCommunity(items, "chen")[0]?.publicName).toBe("Study No. 3");
  });

  it("answers empty when nothing matches, rather than everything", () => {
    expect(filterCommunity(items, "tuba")).toHaveLength(0);
  });
});
