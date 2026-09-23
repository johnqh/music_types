import { describe, expect, it } from "vitest";
import {
  communityItemTitle,
  communityListState,
  filterCommunity,
  publishedSnapshotUrl,
} from "./community-search";

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

describe("communityItemTitle", () => {
  it("prefers the public title, falling back to the snapshot name", () => {
    expect(communityItemTitle({ publicName: "Nocturne", name: "v3" })).toBe("Nocturne");
    expect(communityItemTitle({ publicName: "  ", name: "v3" })).toBe("v3");
  });
});

describe("communityListState", () => {
  it("is loading until the list arrives", () => {
    expect(communityListState(null, "", false)).toEqual({ kind: "loading", visible: [] });
  });

  it("says a failed load, whatever else is true", () => {
    expect(communityListState(null, "", true).kind).toBe("failed");
    expect(communityListState(items, "ada", true).kind).toBe("failed");
  });

  it("tells an empty community from a search that matched nothing", () => {
    expect(communityListState([], "", false).kind).toBe("empty");
    expect(communityListState([], "zzz", false).kind).toBe("empty");
    expect(communityListState(items, "zzz", false)).toEqual({ kind: "noMatch", visible: [] });
  });

  it("lists what the query matches", () => {
    const state = communityListState(items, "bo", false);
    expect(state.kind).toBe("list");
    expect(state.visible.map((i) => i.publisherName)).toEqual(["Bo Chen"]);
  });
});

describe("publishedSnapshotUrl", () => {
  it("builds the localized public page's address", () => {
    expect(publishedSnapshotUrl("https://moosiac.com", "en", "abc123")).toBe(
      "https://moosiac.com/en/p/abc123",
    );
  });

  it("tolerates a trailing slash on the origin and escapes the id", () => {
    expect(publishedSnapshotUrl("https://moosiac.com/", "zh", "a b")).toBe(
      "https://moosiac.com/zh/p/a%20b",
    );
  });
});
