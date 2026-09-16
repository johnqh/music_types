/**
 * The documentation's vocabulary: which topics exist, how they group, and the
 * shapes of a topic, a resource link and a shortcut row.
 *
 * The content tables built from these — `DOCS_TOPICS`, `RESOURCE_GROUPS` —
 * are music_lib's, and `SHORTCUTS` is music_editing's, beside the bindings it
 * is checked against. Every description is an i18n key: the prose lives in
 * each host's locale files.
 */

/** Every documentation topic, in the order the list shows them. */
export const DOCS_TOPIC_IDS = [
  "getting-started",
  "navigation",
  "editor",
  "notation",
  "structure",
  "tracks",
  "playback",
  "midi-input",
  "inspector",
  "generation",
  "sharing",
  "settings",
  "shortcuts",
  "instruments",
  "formats",
  "limits",
] as const;
export type DocsTopicId = (typeof DOCS_TOPIC_IDS)[number];

/** Extra content a topic renders beneath its prose, built from live data. */
export type DocsWidget = "shortcuts" | "instruments" | "formats";

export type DocsSubsection = {
  /** i18n key for the subsection heading. */
  heading: string;
  /** i18n keys, one per paragraph. */
  body: readonly string[];
};

export type DocsTopic = {
  id: DocsTopicId;
  /** i18n key for the title shown in the list and at the head of the page. */
  title: string;
  /** i18n key for the one-line summary under the title in the list. */
  summary: string;
  sections: readonly DocsSubsection[];
  widget?: DocsWidget;
};

/** The group a topic sits under in the navigation list. */
export const DOCS_GROUPS = ["start", "using", "reference"] as const;
export type DocsGroup = (typeof DOCS_GROUPS)[number];

/** One place to find music to open. */
export type Resource = {
  /** i18n key suffix under `resources.link`, and the React key. */
  key: string;
  name: string;
  url: string;
};

/** Resources grouped by which importer the files feed. */
export type ResourceGroup = {
  /** i18n key suffix under `resources.group`, for the title and route line. */
  key: string;
  links: readonly Resource[];
};

export type ShortcutRow = {
  /** The keys, written out. Mutually exclusive with `keysKey`. */
  keys?: string;
  /** A translated description of the gesture, where it is not a key chord. */
  keysKey?: string;
  actionKey: string;
};

/** Which part of the editor a shortcut belongs to — the docs group by these. */
export const SHORTCUT_GROUPS = [
  "transport",
  "editing",
  "selection",
  "noteEntry",
  "marks",
  "caret",
  "pointer",
] as const;
export type ShortcutGroup = (typeof SHORTCUT_GROUPS)[number];
