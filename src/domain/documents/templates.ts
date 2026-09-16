/**
 * Which starter scores exist, as vocabulary.
 *
 * The templates themselves — the instruments, clefs and bar counts each builds
 * — are music_lib's. The ids are here because a host keys its copy off them.
 */

/** Every template music_lib can build. Stable — it is persisted in nothing, but hosts key their copy off it. */
export const TEMPLATE_IDS = [
  "lead-sheet",
  "piano-grand-staff",
  "string-quartet",
  "jazz-combo",
  "rock-band",
  "satb-choir",
  "drum-kit",
  "waltz",
  "jig",
  "gentle-piano-melody",
  "pop-arrangement",
  "orchestral-passage",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/**
 * The name and description shown for each template, supplied by the host.
 *
 * music_lib's templates own the *music* — which instruments, clefs, keys and
 * bar counts a starter score has — and nothing else. The words describing them
 * are the host's, because only the host knows what language it is speaking.
 */
export type TemplateCopy = Record<
  TemplateId,
  { name: string; description: string }
>;
