/**
 * Filtering the community list by what somebody typed.
 *
 * **On the client, over the list already fetched.** That is honest at this
 * size: the page shows what a single request returned, and filtering it is a
 * reading aid rather than a query. Real server-side search belongs with a
 * `music_api` route and a plan of its own, and pretending to have one — by
 * paging on the client, say — would be worse than not having it.
 *
 * Matches the **title and the publisher**, which is what somebody scanning this
 * list is actually reading. Case-insensitive and by substring, because a person
 * typing three letters of a name means "find that", not "starts with".
 *
 * Here rather than in an app because both of them show this list, and a filter
 * that differed between them would mean the same search found different music
 * depending on which app you ran it in.
 */

/** The fields a community row is searched on. Structural, so callers may pass more. */
export type CommunitySearchable = {
  publicName: string;
  publisherName: string;
};

export function filterCommunity<T extends CommunitySearchable>(
  items: readonly T[],
  query: string,
): readonly T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (item) =>
      item.publicName.toLowerCase().includes(needle) ||
      item.publisherName.toLowerCase().includes(needle),
  );
}

/**
 * The title a community row shows: the public title, else the snapshot name.
 *
 * `publicName` is always present on the wire, but it can be blank for
 * something published before public titles existed, and an empty row is not a
 * title.
 */
export function communityItemTitle(item: {
  publicName: string;
  name: string;
}): string {
  return item.publicName.trim() || item.name;
}

/**
 * Which of the list's states to draw, and the rows to draw in it.
 *
 * Distinct empty states, because they mean different things: a failed load, a
 * community with nothing in it, and a search that matched nothing. Collapsing
 * the last two tells a reader who mistyped that nobody has published anything.
 * A failure wins over everything, and `null` items is still loading.
 */
export type CommunityListState<T> = {
  kind: "loading" | "failed" | "empty" | "noMatch" | "list";
  visible: readonly T[];
};

export function communityListState<T extends CommunitySearchable>(
  items: readonly T[] | null,
  query: string,
  failed: boolean,
): CommunityListState<T> {
  if (failed) return { kind: "failed", visible: [] };
  if (items === null) return { kind: "loading", visible: [] };
  if (items.length === 0) return { kind: "empty", visible: [] };
  const visible = filterCommunity(items, query);
  return { kind: visible.length === 0 ? "noMatch" : "list", visible };
}

/**
 * The shareable address of a published snapshot: `<origin>/<lang>/p/<id>`.
 *
 * The web app's route, which is the page a link opens whichever app copied it
 * — the native app used to derive the host from the API URL and drop the
 * language segment, producing a link that did not match the web route.
 */
export function publishedSnapshotUrl(
  webOrigin: string,
  lang: string,
  publicId: string,
): string {
  const origin = webOrigin.replace(/\/+$/, "");
  return `${origin}/${lang}/p/${encodeURIComponent(publicId)}`;
}
