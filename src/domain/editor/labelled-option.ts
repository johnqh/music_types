/** One entry of a picker: the value it sets and the text it shows (see `labelledOptions` in music_lib). */
export type LabelledOption<T extends string> = { value: T; label: string };
