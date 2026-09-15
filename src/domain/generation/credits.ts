/**
 * Whether the generate controls stand aside for want of credits.
 *
 * A courtesy gate, not the rule — `POST /jobs` answers 402 on its own — so it
 * is deliberately lax. It gates at a balance of **zero or below only**, not
 * when an estimate exceeds the balance: a job may overdraw once by design, and
 * a stricter check would refuse work the server accepts. An unknown balance
 * (still loading, or the request failed) does not gate, and a site
 * administrator never does, since the server generates for them for free.
 * Both apps had this expression inline.
 */
export function isOutOfCredits(
  balance: number | null | undefined,
  siteAdmin: boolean,
): boolean {
  if (siteAdmin) return false;
  return balance !== null && balance !== undefined && balance <= 0;
}
