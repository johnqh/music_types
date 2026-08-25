/**
 * What the transport is doing, as a value both halves of the app can name.
 *
 * It lived on the playback slice, and the *editing* slice imported it there —
 * the score's edit lock has to ask whether the transport is playing before it
 * will accept a content change. That single import was the one edge pointing
 * the wrong way when the editing engine was split into its own package, and it
 * was pointing that way for no reason: three words are not playback logic.
 *
 * Declared as a list with the type read off it, like every other closed
 * vocabulary here — see `vocabulary-source.test.ts`.
 */
export const TRANSPORT_STATES = ["stopped", "playing", "paused"] as const;
export type TransportState = (typeof TRANSPORT_STATES)[number];
