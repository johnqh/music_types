import { z } from "zod";

/**
 * The briefs a reader can start a generation from, as ids rather than as text.
 *
 * Which briefs suit which genre is **product data the server owns** — it is
 * served by `GET /public/presets` so it can be retuned without shipping an app,
 * and so two apps offering "the presets for reggae" cannot offer different
 * ones. The *words* stay with the hosts, which is the same division
 * `MusicXmlWarnings` uses and the reason a Chinese reader gets Chinese: a
 * library that held the copy would hold it in one language.
 *
 * The vocabulary itself lives here rather than on the server because both ends
 * need it. The server must not serve a brief no app can name, and each app must
 * be able to prove — offline, in a test — that it has words for every brief it
 * could ever be sent. A list only the server had would make the second
 * impossible, which is exactly how a menu comes to print `openingTitle` at a
 * reader.
 *
 * A brief names a subject and a shape, never a genre: `style` already travels
 * as its own expanded phrase, so a preset that said "reggae" would say it twice
 * and would be wrong the moment it were served under another style. That is
 * what lets one brief be assigned to several genres.
 */
export const SCORE_PRESET_KEYS = [
  // Shape and craft
  "gentleMelody",
  "simpleBeginner",
  "openingTitle",
  "slowBuild",
  "loopableLoop",
  "callAndResponse",
  "quietEnding",
  "singleHook",
  // Songs
  "verseChorus",
  "loveSong",
  "leavingHome",
  "lateNightDrive",
  "breakupSong",
  "crowdSinger",
  "rainyWindow",
  "summerDay",
  // Groove
  "walkingBass",
  "lockedGroove",
  "handclapBackbeat",
  "halfTimeDrop",
  "drivingEighths",
  "syncopatedRiff",
  // Character
  "triumphant",
  "menacing",
  "bittersweet",
  "playfulDance",
  "lullaby",
  "restless",
  "lonely",
  "celebration",
  // Scenes
  "chaseScene",
  "battleTheme",
  "creditsRoll",
  "marketScene",
  "sunriseScene",
  "ceremonyProcession",
  // Idioms a genre owns
  "twelveBarShuffle",
  "improvisedSolo",
  "fiddleAnswers",
  "organStabs",
  "brassStabs",
  "pedalDrone",
  "palmMutedRiff",
  "threeChordRush",
] as const;

export type ScorePresetKey = (typeof SCORE_PRESET_KEYS)[number];

/** Whether a string is a brief this vocabulary knows. */
export function isScorePresetKey(value: string): value is ScorePresetKey {
  return (SCORE_PRESET_KEYS as readonly string[]).includes(value);
}

/**
 * What `GET /public/presets` answers.
 *
 * An object rather than a bare array, so the response can gain a field without
 * every client having to be changed on the same day.
 */
export const scorePresetsResponseSchema = z.object({
  presets: z.array(z.enum(SCORE_PRESET_KEYS)),
});

export type ScorePresetsResponse = z.infer<typeof scorePresetsResponseSchema>;
