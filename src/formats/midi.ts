/**
 * A neutral Standard MIDI File model, shaped by exactly what the three MIDI
 * adapters in music_lib read and write — so that music_lib carries no MIDI
 * library of its own and a different codec can be dropped in behind it.
 */
export type MidiNote = {
  midi: number;
  ticks: number;
  durationTicks: number;
  velocity: number;
};
export type MidiControlChange = {
  number: number;
  ticks: number;
  value: number;
};
export type MidiTempoEvent = { ticks: number; bpm: number };
export type MidiTimeSignatureEvent = {
  ticks: number;
  timeSignature: [number, number];
};

export type MidiTrackData = {
  name: string;
  channel: number;
  instrument: { number: number; name?: string };
  notes: MidiNote[];
  /**
   * Keyed by CC number, not a flat list. The importer looks up sustain (64),
   * volume (7) and pan (10) directly by number; flattening them would force
   * every consumer to re-group, and getting that wrong loses volume and pan
   * silently rather than loudly.
   */
  controlChanges: Record<number, MidiControlChange[]>;
  durationTicks: number;
  /** Per-track duration in seconds; the import wizard's track list shows it. */
  durationSeconds: number;
};

export type MidiFile = {
  header: {
    ppq: number;
    name?: string;
    tempos: MidiTempoEvent[];
    timeSignatures: MidiTimeSignatureEvent[];
  };
  tracks: MidiTrackData[];
  /** Longest track duration in seconds. */
  duration: number;
};
