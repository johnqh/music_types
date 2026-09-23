/**
 * What the Replace form holds and submits, as vocabulary.
 *
 * Turning a submission into a request (`prepareReplacement`) is
 * music_editing's, because the region comes from the selection; building one
 * from a form (`defaultReplaceSubmission`, `buildReplaceSubmission`) is
 * music_lib's.
 */
import type { ScoreRange } from "../../model/score";
import type { RegenerateRegionRequest } from "../../model/generation";
import type { GenerateScoreComplexity } from "./request-drafts";

/** What the Replace dialog collects. The region it applies to is derived, not asked for. */
export type ReplaceSubmission = {
  instruction: string;
  /**
   * Which generation backend writes the replacement.
   *
   * Collected here rather than read from a setting, for the same reason the
   * Generate dialog asks: a replacement is the cheapest thing in the system to
   * run twice and compare by ear, which is exactly when you want to change
   * backends for one call without changing it for everything.
   */
  variant?: string;
  style?: string;
  mood?: string;
  complexity?: "simple" | "moderate" | "complex";
  constraints: {
    preserveBoundaryNotes: boolean;
    preserveHarmony: boolean;
    preserveRhythm: boolean;
    preserveMelody: boolean;
  };
};

/** A replacement ready to submit: which kind of job, the request, and the region it will overwrite. */
export type PreparedReplacement = {
  kind: "replace-notes" | "replace-measures" | "replace-track";
  request: RegenerateRegionRequest;
  range: ScoreRange;
};

/**
 * The preset instructions, as spec §12 lists them — by key.
 *
 * Choosing one fills the instruction field with its text in the reader's
 * language, which is then what the model is asked. The same model as New
 * Project's briefs (`generateScore.preset.<key>`), and for the same reason: the
 * model reads Chinese as well as English, and a Chinese reader handed fourteen
 * English sentences to choose from is prompting in a language the rest of the
 * form is not in. They were English literals in both apps until now, so the
 * words move into each app's locale under `replace.preset.<key>`, and the list
 * of which presets exist is stated here once.
 *
 * English, for the locale files: moreDramatic "Make this more dramatic",
 * simplify "Simplify this passage", rhythmicVariation "Add rhythmic
 * variation", memorableMelody "Make the melody more memorable",
 * strongerTransition "Create a stronger transition", harmonicTension "Add
 * harmonic tension", resolvePhrase "Resolve the phrase", moreUpbeat "Make this
 * more upbeat", darker "Make this darker", variationKeepMelody "Create a
 * variation while preserving the melody", keepRhythmChangeHarmony "Preserve
 * rhythm but change harmony", keepHarmonyChangeMelody "Preserve harmony but
 * change melody", addAccompaniment "Add accompaniment", thinOrchestration "Thin
 * out the orchestration".
 */
export const REPLACE_PRESET_KEYS = [
  "moreDramatic",
  "simplify",
  "rhythmicVariation",
  "memorableMelody",
  "strongerTransition",
  "harmonicTension",
  "resolvePhrase",
  "moreUpbeat",
  "darker",
  "variationKeepMelody",
  "keepRhythmChangeHarmony",
  "keepHarmonyChangeMelody",
  "addAccompaniment",
  "thinOrchestration",
] as const;

export type ReplacePresetKey = (typeof REPLACE_PRESET_KEYS)[number];

/**
 * The Replace form's state. `style` and `mood` use `''` for "none", as the New
 * Project draft does; the submission omits them, which is what "no particular
 * style" means on the wire.
 */
export type ReplaceDraft = {
  instruction: string;
  style: string;
  mood: string;
  complexity: GenerateScoreComplexity;
  variant: string;
  constraints: ReplaceSubmission["constraints"];
};
