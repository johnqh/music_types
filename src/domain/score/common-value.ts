/**
 * The one value a set of objects agrees on, or `null` where they differ.
 *
 * This is what lets a property panel act on a *selection* rather than on one
 * object. A field that showed the first item's value would say "Staccato" for a
 * selection that is mostly not, and setting it would then look like a no-op on
 * everything that already agreed.
 *
 * Compared by **structure, not identity**: pitches, time signatures and key
 * signatures are all small objects rebuilt on every read, so `===` would report
 * every multi-note selection as mixed. `JSON.stringify` is enough here because
 * everything it is asked about is plain score data with a stable key order —
 * these are model objects, not arbitrary user values.
 *
 * In music_types because both apps' inspectors need it and the rule is about
 * *a selection of score objects*, not about a panel. It was written twice, once
 * per app, which is how the two came to disagree about whether an empty
 * selection was `null` or mixed.
 */
export function commonValue<T>(values: readonly T[]): T | null {
  if (values.length === 0) return null;
  const first = values[0] as T;
  const firstKey = JSON.stringify(first);
  return values.every((value) => JSON.stringify(value) === firstKey)
    ? first
    : null;
}
