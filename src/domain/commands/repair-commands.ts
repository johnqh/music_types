/**
 * The "fix every issue you can" edit, as one undoable command.
 *
 * One command rather than one per rule, because that is what the reader asked
 * for: the issue list is a single list and clearing it is a single decision.
 * Splitting it would also make undo wrong — stepping back through twelve
 * separate repairs to get the score you had before pressing one button.
 *
 * `kind` is left at the default `content`, so this is refused while the
 * transport is playing like every other edit. Rewriting notes out from under
 * a running engine is exactly what that lock exists to prevent.
 */
import { transformCommand } from "./snapshot.js";
import type { ScoreCommand } from "./types.js";
import { repairScore } from "../validation/repair.js";

/**
 * Repairs every validation issue that has an unambiguous fix.
 *
 * A no-op on a clean score: `repairScore` returns its input by reference, so
 * the command produces an identical score and the caller can compare
 * identities to decide whether anything happened.
 */
export function repairScoreCommand(label: string): ScoreCommand {
  return transformCommand(label, (score) => repairScore(score).score);
}
