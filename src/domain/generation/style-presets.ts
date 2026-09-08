import type { KeySignature } from "../../model/score.js";
import {
  measuresForSeconds,
  SONG_SECONDS,
} from "../notation/music-vocabulary.js";

/**
 * The keyword values the generation prompt parser branches on.
 *
 * These are shared product data: the app offers them, and the backend needs to
 * know that every offered prompt phrase has genre mechanics.
 */
const GENERATE_SCORE_STYLE_KEYS = [
  "waltz",
  "jazz",
  "pop",
  "cinematic",
  "ambient",
  "battle",
  "rock",
  "punk",
  "heavyMetal",
  "blues",
  "country",
  "bluegrass",
  "funk",
  "soul",
  "ragtime",
  "swing",
  "bossaNova",
  "samba",
  "salsa",
  "tango",
  "reggae",
  "hipHop",
  "trap",
  "lofi",
  "house",
  "techno",
  "trance",
  "edm",
  "electroSwing",
  "disco",
  "classical",
  "baroque",
  "march",
] as const;

export type GenerateScoreStyle = (typeof GENERATE_SCORE_STYLE_KEYS)[number];

export const GENERATE_SCORE_STYLE_OPTIONS: readonly string[] =
  GENERATE_SCORE_STYLE_KEYS;

export type GenerateScoreStylePreset = {
  /** What the model is told the style is. */
  prompt: string;
  /** Picker values, in ensemble order. */
  instruments: readonly string[];
  /** Beats per minute, in the middle of the range the genre is played at. */
  tempo: number;
  /** Bars the piece runs for, derived from the preset's tempo and meter. */
  measures: number;
  /** How long this style's pieces run, in seconds. Defaults to a typical song. */
  seconds?: number;
  /** The genre's form in bars, where it has one. */
  formBars?: number;
  /** A key of the app's generate-score time signature options. */
  timeSignature: string;
  /** The mode the genre usually sits in; absent where it is not typical. */
  mode?: KeySignature["mode"];
};

const KIT = "kit:0";

const STYLE_PRESET_SOURCE: Readonly<
  Record<GenerateScoreStyle, Omit<GenerateScoreStylePreset, "measures">>
> = {
  waltz: {
    prompt:
      'waltz — a lilting three-four with the weight on beat one and a light "oom-pah-pah" accompaniment',
    instruments: ["0", "48", "43"],
    tempo: 160,
    timeSignature: "3/4",
  },
  jazz: {
    prompt:
      "jazz — swung eighth notes, walking bass, extended chords, and a melody that phrases across the barline rather than sitting on the beat",
    instruments: ["66", "0", "32", KIT],
    tempo: 132,
    timeSignature: "4/4",
  },
  pop: {
    prompt:
      "pop — a clear singable hook, four-bar phrases, a backbeat on two and four, and space between the phrases",
    instruments: ["0", "27", "33", KIT],
    tempo: 120,
    timeSignature: "4/4",
  },
  cinematic: {
    prompt:
      "cinematic orchestral — long sustained lines that build, a rising dynamic arc, and rhythm that serves the swell rather than a groove",
    instruments: ["48", "40", "42", "60", "47"],
    tempo: 90,
    timeSignature: "4/4",
    mode: "minor",
  },
  ambient: {
    prompt:
      "ambient — slow evolving pads, very long note values, no strong pulse, and silence used as a voice",
    instruments: ["89", "0", "48"],
    tempo: 70,
    timeSignature: "4/4",
  },
  battle: {
    prompt:
      "driving battle music — insistent ostinato, hard accents, brass stabs against a relentless low pulse",
    instruments: ["61", "48", "47", KIT],
    tempo: 150,
    timeSignature: "4/4",
    mode: "minor",
  },
  rock: {
    prompt:
      "rock — a hard backbeat on two and four, power-chord riffing, and a bass locked to the kick",
    instruments: ["29", "27", "33", KIT],
    tempo: 128,
    timeSignature: "4/4",
  },
  punk: {
    prompt:
      "punk — fast straight eighths on downstrokes, three chords, no ornament, and a snare driving every backbeat. The guitar figure repeats unchanged through a section; the energy comes from the tempo and the drive, never from varying the part.",
    instruments: ["30", "29", "34", KIT],
    tempo: 180,
    timeSignature: "4/4",
  },
  heavyMetal: {
    prompt:
      "heavy metal — built on ONE palm-muted galloping low riff, repeated bar after bar through a section rather than rewritten each bar; minor and modal, double-kick drive underneath, and long held high notes over the top. The riff is the song: keep it the same and let the drums and the held lead supply the variation. ONE riff means one FIGURE, not one note - the riff moves between several pitches (root, flat-7, flat-6 and back is the classic shape), and a bar of the same pitch struck eight times is a pedal, not a riff.",
    instruments: ["30", "29", "34", KIT],
    tempo: 152,
    timeSignature: "4/4",
    mode: "minor",
  },
  blues: {
    formBars: 12,
    prompt:
      "twelve-bar blues — shuffle feel, blue notes and bends, call-and-response between a voice-like melody and answering fills, dominant seventh chords",
    instruments: ["27", "22", "33", KIT],
    tempo: 88,
    timeSignature: "4/4",
  },
  country: {
    prompt:
      'country — a two-beat "boom-chick" bass and guitar, bright major harmony, fiddle and steel fills answering the melody',
    instruments: ["25", "110", "27", "32", KIT],
    tempo: 118,
    timeSignature: "4/4",
  },
  bluegrass: {
    prompt:
      "bluegrass — fast acoustic picking, banjo rolls in constant eighths under a syncopated fiddle melody, driving upright bass on one and three",
    instruments: ["105", "110", "25", "32"],
    tempo: 160,
    timeSignature: "4/4",
  },
  funk: {
    prompt:
      "funk — heavily syncopated sixteenth-note groove, everything locked to a hard downbeat on the one, staccato stabs and plenty of rests",
    instruments: ["36", "28", "61", "4", KIT],
    tempo: 104,
    timeSignature: "4/4",
  },
  soul: {
    prompt:
      "soul — a laid-back backbeat sitting slightly behind the beat, gospel-tinged chords, horn stabs answering a vocal-style melody",
    instruments: ["16", "4", "33", "61", KIT],
    tempo: 96,
    timeSignature: "4/4",
  },
  ragtime: {
    formBars: 16,
    prompt:
      "ragtime — a syncopated right-hand melody against a steady striding left-hand bass in two, cheerful and precise",
    instruments: ["0"],
    tempo: 96,
    timeSignature: "2/4",
  },
  swing: {
    prompt:
      "big-band swing — swung eighth notes, brass and reed sections trading riffs, walking bass, ride-cymbal pulse with accents on two and four",
    instruments: ["56", "66", "57", "0", "32", KIT],
    tempo: 168,
    timeSignature: "4/4",
  },
  bossaNova: {
    prompt:
      "bossa nova — a gentle syncopated guitar pattern, soft brushed drums, a lyrical melody sitting behind the beat, rich seventh and ninth chords",
    instruments: ["24", "0", "32", KIT],
    tempo: 132,
    timeSignature: "4/4",
  },
  samba: {
    prompt:
      "samba — fast two-beat percussion-driven groove, heavy syncopation on the offbeats, surdo pulse landing on beat two",
    instruments: ["24", "61", "32", KIT],
    tempo: 100,
    timeSignature: "2/4",
  },
  salsa: {
    prompt:
      "salsa — clave-driven, a montuno piano ostinato, syncopated brass hits, busy percussion, bass playing the tumbao rather than the downbeat",
    instruments: ["0", "56", "57", "32", KIT],
    tempo: 190,
    timeSignature: "4/4",
  },
  tango: {
    prompt:
      "tango — sharp dotted rhythms and dramatic accents, minor key, sudden stops and rubato pulls against a strict pulse",
    instruments: ["23", "40", "0", "43"],
    tempo: 120,
    timeSignature: "4/4",
    mode: "minor",
  },
  reggae: {
    prompt:
      "reggae — one-drop: the kick lands on beat three, not one; guitar and organ chop the offbeat eighths; bass plays a heavy melodic line, low and sparse",
    instruments: ["28", "18", "33", KIT],
    tempo: 78,
    timeSignature: "4/4",
  },
  hipHop: {
    prompt:
      "hip-hop — a hard boom-bap drum pattern with swung sixteenths, a deep sustained sub bass, sparse looping keys, and space left for a vocal",
    instruments: ["39", "4", "48", KIT],
    tempo: 90,
    timeSignature: "4/4",
    mode: "minor",
  },
  trap: {
    prompt:
      "trap — half-time: the snare lands on beat three alone, an 808 sub bass slides between long tuned notes, and hi-hats roll in fast subdivisions over large gaps",
    instruments: ["38", "11", "89", KIT],
    tempo: 140,
    timeSignature: "4/4",
    mode: "minor",
  },
  lofi: {
    prompt:
      "lo-fi hip-hop — slow swung drums slightly off the grid, warm jazzy minor seventh chords, a sparse melody, unhurried and repetitive",
    instruments: ["4", "33", "89", KIT],
    tempo: 74,
    timeSignature: "4/4",
    mode: "minor",
  },
  house: {
    prompt:
      "house — four-on-the-floor kick, offbeat open hats, a repetitive synth riff, and a bassline locked to the eighths between the kicks",
    instruments: ["81", "38", "89", KIT],
    tempo: 126,
    timeSignature: "4/4",
  },
  techno: {
    prompt:
      "techno — machine-like and loop-based: four-on-the-floor kick, sixteenth-note hats, one short synth-bass cell repeated, and timbre rather than chord changes carrying the track",
    instruments: ["38", "81", "89", KIT],
    tempo: 132,
    timeSignature: "4/4",
    mode: "minor",
  },
  trance: {
    prompt:
      "trance — four-on-the-floor with an offbeat synth bass after every kick, supersaw arpeggios, and long builds and releases in sixteen-bar blocks",
    instruments: ["81", "38", "89", KIT],
    tempo: 138,
    timeSignature: "4/4",
    mode: "minor",
  },
  edm: {
    prompt:
      "edm — electronic dance built on a clear build, drop and breakdown in eight-bar blocks, four-on-the-floor underneath and a big repeated lead hook through the drop",
    instruments: ["81", "38", "89", KIT],
    tempo: 128,
    timeSignature: "4/4",
    mode: "minor",
  },
  electroSwing: {
    prompt:
      "electro swing — vintage swing horns over a modern four-on-the-floor electronic beat, minor and bluesy in a gypsy-jazz vein; hard-swung eighths, syncopated and playful, with clarinet and trumpet riffs answering each other",
    instruments: ["56", "71", "38", KIT],
    tempo: 122,
    timeSignature: "4/4",
    mode: "minor",
  },
  disco: {
    prompt:
      "disco — four-on-the-floor kick, offbeat hi-hats, an octave-jumping bassline, and string and guitar figures on the sixteenths",
    instruments: ["48", "28", "33", KIT],
    tempo: 120,
    timeSignature: "4/4",
  },
  classical: {
    prompt:
      "classical — balanced four-bar phrases answering each other, an Alberti or broken-chord accompaniment under a clear diatonic melody, and a cadence every four or eight bars",
    instruments: ["0", "40", "42"],
    tempo: 108,
    timeSignature: "4/4",
  },
  baroque: {
    prompt:
      "baroque — a steady walking bass, contrapuntal interweaving voices, sequences and ornamented melodic lines, terraced dynamics",
    instruments: ["6", "40", "42"],
    tempo: 100,
    timeSignature: "4/4",
  },
  march: {
    prompt:
      "march — a firm two-beat pulse, dotted fanfare rhythms, a brass melody over a low oom-pah, crisp snare figures",
    instruments: ["56", "57", "58", KIT],
    tempo: 116,
    timeSignature: "2/4",
  },
};

/**
 * The styles, each with the bars its own tempo and meter need for a song.
 */
export const GENERATE_SCORE_STYLE_PRESETS: Readonly<
  Record<string, GenerateScoreStylePreset>
> = Object.fromEntries(
  Object.entries(STYLE_PRESET_SOURCE).map(([style, preset]) => [
    style,
    {
      ...preset,
      measures: measuresForSeconds(
        preset.seconds ?? SONG_SECONDS.typical,
        preset.tempo,
        beatsPerBarOf(preset.timeSignature),
        preset.formBars,
      ),
    },
  ]),
);

/** Beats in a bar, from a picker value like "6/8". */
function beatsPerBarOf(timeSignature: string): number {
  const [numerator] = timeSignature.split("/");
  const beats = Number(numerator);
  return Number.isFinite(beats) && beats > 0 ? beats : 4;
}
