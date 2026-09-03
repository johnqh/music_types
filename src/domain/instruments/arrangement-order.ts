/**
 * The order to write an arrangement's parts in, most significant first.
 *
 * Generating every track in one request asks a model to invent a whole
 * arrangement in a single forward pass, and the parts come back the way that
 * implies: rhythmically interchangeable, because nothing anchors any of them to
 * anything. Written one at a time, each part can be composed *against* what
 * already exists — which is how a person arranges, and which turns "no two
 * parts may share an onset pattern" from a rule the model has to hold in its
 * head into a fact it can read off the page.
 *
 * Order matters because the first part is written with no constraints and every
 * later one bends to fit it. So the first part has to be **the one the genre is
 * carried by**, and that is not the same instrument in every genre: a reggae
 * tune is its bassline, a metal track is its riff, a country song is its
 * melody. Getting this backwards produces a technically fine arrangement built
 * around the wrong thing — a reggae bass forced to fit a keyboard part invented
 * before it.
 *
 * The ranking is deliberately coarse. It sorts parts into a handful of roles
 * and orders the roles per genre; it does not try to decide which of two
 * guitars is "the" lead, because the roster order already carries that intent
 * (a preset lists its lead first) and a stable sort preserves it.
 */
import { gmFamilyOf } from "./gm.js";
import type { GmFamily } from "./gm.js";

/** What a part does in an arrangement, which is what its writing order turns on. */
export type ArrangementRole = "lead" | "harmony" | "bass" | "drums";

/** The minimum a part needs to be ranked: what it plays, and whether it is a kit. */
export type RankableTrack = {
  midiProgram: number;
  clef?: string | undefined;
};

/**
 * Families that accompany rather than carry a tune.
 *
 * A pad, an ensemble patch and an organ are written *under* something; asked to
 * go first they produce block harmony with no tune to sit beneath, and the
 * melody then has to be bent around a chord sequence chosen without it.
 */
const HARMONY_FAMILIES: ReadonlySet<GmFamily> = new Set<GmFamily>([
  "synth-pad",
  "ensemble",
  "organ",
]);

/**
 * The three General MIDI programs that are a human voice.
 *
 * GM files them under `ensemble`, beside String Ensemble and Orchestra Hit --
 * which is a fair description of Choir Aahs used as a wash, and the wrong one
 * for the part carrying the song. Named here rather than moved to another
 * family because the family is GM's and is right about everything else in it.
 *
 * `Pad 4 (choir)` (91) is deliberately absent: it says pad in its name and is
 * one. `Lead 6 (voice)` (85) is absent too, already reaching `lead` through
 * `synth-lead`.
 */
const VOICE_PROGRAMS: ReadonlySet<number> = new Set([
  52, // Choir Aahs
  53, // Voice Oohs
  54, // Synth Voice
]);

/** Whether this program is a sung part rather than an instrument. */
export function isVocalProgram(midiProgram: number): boolean {
  return VOICE_PROGRAMS.has(midiProgram);
}

/**
 * A voice carries the tune, and the ambiguity is resolved in its favour.
 *
 * Choir Aahs held under a chorus is genuinely harmony, and nothing in a program
 * number can tell that from a sung melody -- so this is a judgement about which
 * mistake costs more. Read as harmony, a vocal part is written as filler around
 * a tune chosen without it, and -- worse -- `mustBreathe` covers `lead` alone,
 * so the one part that physically CANNOT run sixteen unbroken bars was the one
 * part never asked to rest. Read as lead, a choir pad collects a finding asking
 * it to breathe, which costs one retry and is not even wrong.
 */
export function roleOf(track: RankableTrack): ArrangementRole {
  if (track.clef === "percussion") return "drums";
  if (isVocalProgram(track.midiProgram)) return "lead";
  const family = gmFamilyOf(track.midiProgram);
  if (family === "bass") return "bass";
  if (HARMONY_FAMILIES.has(family)) return "harmony";
  return "lead";
}

/**
 * The default order: the tune, then the floor under it, then the parts that
 * fill in, then the kit.
 *
 * Drums last on purpose, and it is the one position that is the same in every
 * genre below. A kit part is a response to where the accents already fell —
 * given the other parts it can place a fill at a phrase end and a crash on a
 * section start, and written first it can only lay down a grid for everything
 * else to be quantised against, which is the metronome failure the percussion
 * rules already spend a paragraph on.
 */
const DEFAULT_ORDER: readonly ArrangementRole[] = [
  "lead",
  "bass",
  "harmony",
  "drums",
];

/**
 * Genres the rhythm section carries, where the bass is written first.
 *
 * In reggae the bassline *is* the tune — the "riddim" is named and reused
 * across songs while melodies come and go — and the same is true of funk, hip
 * hop, house and disco, where the groove is the material and the melody
 * decorates it. Writing a melody first in those styles produces a bass that is
 * following a tune instead of stating the hook.
 */
const GROOVE_FIRST: readonly ArrangementRole[] = [
  "bass",
  "drums",
  "harmony",
  "lead",
];

const GROOVE_LED =
  /\b(reggae|ska|dub|funk|disco|house|hip hop|hip-hop|lofi|lo-fi|soul|samba|salsa|bossa|tango|afrobeat)\b/i;

/**
 * Genres built on a riff, where the riff is a lead part and goes first anyway —
 * but the kit is promoted above the harmony, because in these styles the drums
 * and the riff are locked together and everything else fills in around the pair.
 */
const RIFF_LED = /\b(metal|punk|hard rock|rock|grunge|battle|march)\b/i;

const RIFF_ORDER: readonly ArrangementRole[] = [
  "lead",
  "bass",
  "drums",
  "harmony",
];

/** The role order this style is arranged in. */
export function roleOrderForStyle(
  style: string | undefined,
): readonly ArrangementRole[] {
  if (!style) return DEFAULT_ORDER;
  // Groove first, since a style phrase like "funk rock" is carried by its
  // groove and would otherwise match the riff branch on its second word.
  if (GROOVE_LED.test(style)) return GROOVE_FIRST;
  if (RIFF_LED.test(style)) return RIFF_ORDER;
  return DEFAULT_ORDER;
}

/**
 * The indices of `tracks`, in the order their parts should be written.
 *
 * A **stable** sort by role rank, so within one role the roster order decides —
 * which is where the intent lives, since a preset and a user both list the part
 * they care about first. Every index appears exactly once, so a caller can
 * write the parts in this order and still assemble a score in roster order.
 */
export function rankTracksForGeneration(
  tracks: readonly RankableTrack[],
  style?: string,
): number[] {
  const order = roleOrderForStyle(style);
  const rankOf = (track: RankableTrack): number => {
    const index = order.indexOf(roleOf(track));
    // A role missing from the order sorts last rather than first: `indexOf`
    // answers -1, and -1 in front of "lead" would silently promote it.
    return index === -1 ? order.length : index;
  };
  /*
    Among leads, the singer goes first.

    Two parts can both be leads — a vocal and a guitar — and then role alone
    leaves the order to however the roster happened to be typed. In a song the
    answer is not arbitrary: the words and the tune ARE the song, and the parts
    behind them are written to fit. Ranked by index instead, a guitar listed
    first got composed with no melody to sit under, and the singer then had to
    bend around it.
  */
  const voiceFirst = (track: RankableTrack): number =>
    isVocalProgram(track.midiProgram) && track.clef !== "percussion" ? 0 : 1;
  return tracks
    .map((track, index) => ({ index, rank: rankOf(track), voice: voiceFirst(track) }))
    .sort((a, b) => a.rank - b.rank || a.voice - b.voice || a.index - b.index)
    .map((entry) => entry.index);
}
