/**
 * The General MIDI numbers that are the protocol itself, not our choices.
 *
 * A controller number and a reserved channel are facts about MIDI: the file
 * writer and the synth host have to agree about them or a track exported at
 * half volume comes back panned. They agreed by coincidence — each declared
 * its own `CC_VOLUME = 7` — which is exactly the shape of duplication that
 * only shows up as a wrong sound rather than as a failing build.
 *
 * `MIDI_CHANNEL_COUNT` sits here for the same reason it caused a bug: a
 * second drum track was allocated channel 25 while fluidsynth had been given
 * 16, so the track existed, drew, and made no sound.
 */

/** Channel volume (coarse). */
export const CC_VOLUME = 7;

/** Channel pan (coarse), 0 hard left, 64 centre, 127 hard right. */
export const CC_PAN = 10;

/** Channel 10 in the spec's 1-based numbering; the one channel reserved for drums. */
export const PERCUSSION_CHANNEL = 9;

/** Channels per MIDI port. Anything above this must open another synth instance. */
export const MIDI_CHANNELS_PER_PORT = 16;

/** The bank General MIDI keeps its drum kits in. */
export const DRUM_BANK = 128;
