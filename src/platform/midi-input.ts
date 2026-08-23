/**
 * Playing notes in from a MIDI keyboard.
 *
 * Separate from the `.mid` file codec in `@sudobility/music_codecs`: reading a
 * file is byte arithmetic that runs anywhere, while this is a live input
 * device that only a platform can offer. The two have nothing in common but
 * the word MIDI, which is why only this one is a capability.
 *
 * A capability rather than a direct Web MIDI call, for the same reason
 * playback is one: the browser has `navigator.requestMIDIAccess`, React Native
 * has a native module, and neither belongs in app code. A platform that has no
 * MIDI at all implements `isSupported()` as `false` and the app hides the
 * feature — which is the honest answer on a device with no ports.
 */

/** One attached input port. */
export type MidiInputDevice = {
  id: string;
  name: string;
};

/**
 * A key pressed or released.
 *
 * `velocity` is 0–127 as the wire format has it; a note-on at velocity 0 is
 * the note-off some keyboards send instead of a real one, and an
 * implementation reports it as `type: 'off'` so callers never have to know.
 */
export type MidiInputEvent =
  | { type: "on"; note: number; velocity: number }
  | { type: "off"; note: number };

export type MidiInputHandler = (event: MidiInputEvent) => void;

export type MidiInput = {
  /** Whether this platform can offer MIDI input at all. */
  isSupported(): boolean;

  /**
   * Asks the platform for permission and lists what is attached.
   *
   * Rejects when permission is refused. Returns an empty list when permission
   * was granted and nothing is plugged in, which is a different situation and
   * a caller should say so differently.
   */
  listDevices(): Promise<MidiInputDevice[]>;

  /**
   * Starts delivering events from `deviceId`, or from every attached device
   * when it is omitted — which is what somebody with one keyboard wants,
   * without having to choose it first.
   *
   * Returns an unsubscribe function. Calling it twice is safe.
   */
  subscribe(handler: MidiInputHandler, deviceId?: string): () => void;
};
