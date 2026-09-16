/**
 * The paper a score prints on, as vocabulary and picker options.
 *
 * The page geometry that uses these — dimensions, margins, pagination — is
 * music_drawing's.
 */

/** The papers a score prints on, in the order a picker offers them. */
export const PAPER_SIZES = ["a4", "letter", "legal"] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

/** Portrait first: it is the default and what almost every part is. */
export const PAPER_ORIENTATIONS = ["portrait", "landscape"] as const;
export type PaperOrientation = (typeof PAPER_ORIENTATIONS)[number];

const PAPER_LABEL_KEY: Record<PaperSize, string> = {
  a4: "print.paperA4",
  letter: "print.paperLetter",
  legal: "print.paperLegal",
};

/** The CSS `@page { size }` keyword for each paper. */
const PAPER_CSS: Record<PaperSize, string> = {
  a4: "A4",
  letter: "letter",
  legal: "legal",
};

const ORIENTATION_LABEL_KEY: Record<PaperOrientation, string> = {
  portrait: "print.portrait",
  landscape: "print.landscape",
};

/**
 * The paper picker. `css` is the `@page` size keyword; an orientation's value
 * is its own CSS keyword already.
 *
 * A4 has a key like the others even though it reads "A4" in both languages —
 * one shape for every entry is what lets a picker map straight through, and the
 * locales list it as shared by design.
 */
export const PAPER_OPTIONS: ReadonlyArray<{
  value: PaperSize;
  labelKey: string;
  css: string;
}> = PAPER_SIZES.map((value) => ({
  value,
  labelKey: PAPER_LABEL_KEY[value],
  css: PAPER_CSS[value],
}));

export const ORIENTATION_OPTIONS: ReadonlyArray<{
  value: PaperOrientation;
  labelKey: string;
}> = PAPER_ORIENTATIONS.map((value) => ({
  value,
  labelKey: ORIENTATION_LABEL_KEY[value],
}));
