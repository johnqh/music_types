/**
 * What a project's origin becomes once a job has written into it.
 *
 * Only a whole-score generation on a project that had no origin of its own
 * takes the job as its origin: the music came from nowhere else. A project
 * that was imported, transcribed or copied keeps saying so when a track is
 * generated into it or a region replaced — the file is still what the
 * project is — and so does one already generated, whose origin names the job
 * that made it, not the latest one to touch it.
 *
 * Null (a row from before origins existed) is treated as blank here: the
 * generation is the first thing known about where the project came from.
 *
 * Here rather than in music_api alone because both ends apply it: the server
 * when it writes the row, and an editor holding a project open when the live
 * stream delivers the score — which carries no origin — so what it shows
 * agrees with what a re-read would.
 */
import type { ProjectOrigin } from "../../model/api";
import type { GenerationJobKind } from "../../model/generation";

export function originAfterJob(
  current: ProjectOrigin | null | undefined,
  kind: GenerationJobKind,
  jobId: string,
): ProjectOrigin | null {
  if (kind !== "generate-score") return current ?? null;
  if (current && current.kind !== "blank") return current;
  return { kind: "generated", jobId };
}
