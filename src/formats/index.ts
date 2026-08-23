/**
 * Score file-format models: the neutral shapes a MIDI file and a tracker
 * module decode into.
 *
 * Not under `platform/`, deliberately. These carry notes rather than samples,
 * so nothing about them is platform-bound — the codecs that produce them live
 * in `@sudobility/music_codecs` and run identically on web, React Native and
 * the server.
 */
export * from "./midi.js";
export * from "./mod.js";
