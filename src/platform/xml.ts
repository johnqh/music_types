/**
 * The XML surface the MusicXML importer actually uses.
 *
 * Five members, and deliberately so: a real DOM `Element` satisfies this
 * structurally, which means the web parser hands back `DOMParser` output with
 * no adapter at all, and only the React Native side pays for a translation.
 */
export interface XmlElement {
  readonly tagName: string;
  readonly textContent: string | null;
  readonly children: ArrayLike<XmlElement>;
  getAttribute(name: string): string | null;
  getElementsByTagName(name: string): ArrayLike<XmlElement>;
}

/** Thrown for input that is not well-formed XML. */
export class XmlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XmlParseError';
  }
}

export interface XmlParser {
  /** Parses a document and returns its root element. Throws `XmlParseError` on malformed input. */
  parse(text: string): XmlElement;
}
