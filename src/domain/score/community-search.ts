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
