/**
 * The order a closed vocabulary is *offered* in, which is not the order it is
 * declared in.
 *
 * A vocabulary is declared in whatever order it grew — the styles run waltz,
 * jazz, pop, cinematic, ambient, battle — and that is the right order for the
 * source and no order for a reader hunting through thirty-three of them.
 *
 * Sorted on the **label**, not the value: the value is `electroSwing` and the
 * reader sees "Electro Swing", so sorting the keys puts entries wherever their
 * camel-case identifier happens to fall. And sorted with `localeCompare` under
 * the language actually on screen, because the label a Chinese reader is
 * scanning is Chinese — collating those by the English they were translated
 * from produces an order with no visible logic at all.
 *
 * Here rather than in either app because both apps draw these pickers, and an
 * ordering rule written twice is one that eventually disagrees with itself.
 */
export function sortOptionsByLabel<T extends string>(
  values: readonly T[],
  labelOf: (value: T) => string,
  locale?: string,
): T[] {
  // A copy: the vocabularies are module-level constants shared by every caller,
  // and `sort` is in place.
  return [...values].sort((a, b) =>
    labelOf(a).localeCompare(labelOf(b), locale),
  );
}
