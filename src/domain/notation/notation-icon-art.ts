/**
 * The notation glyphs, as data.
 *
 * **Generated — do not edit by hand.** The source of truth is
 * `music_app/src/components/icons/notation-icons.tsx`, rendered and serialized
 * by `music_app/scripts/generate-notation-icon-art.mjs`. Re-run that after
 * changing an icon.
 *
 * Here rather than in an app because two of them draw these: the web toolbar
 * and the React Native one. A second copy would drift from the first the moment
 * either was tuned, and the drift would be invisible — a glyph a pixel off is
 * not something a test notices or a reader can name.
 *
 * Data rather than components for the same reason `icon-art.ts` next door is:
 * this package must work on the backend and add no dependencies, so it cannot
 * hold JSX. Each app replays the shapes with its own primitives — `<path>` on
 * the web, `react-native-svg`'s `Path` on native.
 */

/** Every glyph is authored in a 24×24 box. */
export const NOTATION_ICON_VIEWBOX = 24;

/** A stroke cap/join, spelled as SVG spells it. */
export type NotationLineCap = "butt" | "round" | "square";
export type NotationLineJoin = "miter" | "round" | "bevel";

type Paint = {
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly strokeLinecap?: NotationLineCap;
  readonly strokeLinejoin?: NotationLineJoin;
  readonly strokeDasharray?: string;
  readonly opacity?: number;
  readonly transform?: string;
};

export type NotationIconShape =
  | (Paint & {
      readonly kind: "path";
      readonly d: string;
      readonly fillRule?: "evenodd" | "nonzero";
    })
  | (Paint & {
      readonly kind: "rect";
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx?: number;
    })
  | (Paint & {
      readonly kind: "ellipse";
      readonly cx: number;
      readonly cy: number;
      readonly rx: number;
      readonly ry: number;
    })
  | (Paint & {
      readonly kind: "circle";
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
    })
  | (Paint & {
      readonly kind: "text";
      readonly x: number;
      readonly y: number;
      readonly content: string;
      readonly fontSize?: number;
      readonly fontStyle?: string;
      readonly textAnchor?: string;
    })
  | (Paint & {
      readonly kind: "group";
      readonly shapes: readonly NotationIconShape[];
    });

/**
 * The closed vocabulary, as an array with the type read off it.
 *
 * A union has no runtime form, so anything that must *validate* a name would
 * otherwise write the list out again.
 */
export const NOTATION_ICON_NAMES = [
  "AddMeasureIcon",
  "ArpeggioIcon",
  "ArticulationIcon",
  "BeamBreakIcon",
  "BeamNoneIcon",
  "ChordIcon",
  "ContinuousLayoutIcon",
  "CrescendoIcon",
  "DeleteMeasureIcon",
  "DiminuendoIcon",
  "DottedIcon",
  "DoubleFlatIcon",
  "DoubleSharpIcon",
  "EighthNoteIcon",
  "FermataIcon",
  "FlatIcon",
  "GoToStartIcon",
  "HalfNoteIcon",
  "InsertModeIcon",
  "InsertNoteIcon",
  "InsertRestIcon",
  "MetronomeIcon",
  "NaturalIcon",
  "NextMeasureIcon",
  "OrnamentIcon",
  "PageLayoutIcon",
  "PreviousMeasureIcon",
  "QuantizeIcon",
  "QuarterNoteIcon",
  "ReplaceModeIcon",
  "SelectAllIcon",
  "SharpIcon",
  "SixteenthNoteIcon",
  "SlurIcon",
  "SoloIcon",
  "SunMoonIcon",
  "ThirtySecondNoteIcon",
  "TieIcon",
  "TripletIcon",
  "WholeNoteIcon",
] as const;

export type NotationIconName = (typeof NOTATION_ICON_NAMES)[number];

/**
 * A record, never a parallel array: adding a name above fails to compile until
 * its shapes are supplied here, where an array would silently offer the old set.
 */
export const NOTATION_ICONS: Record<
  NotationIconName,
  readonly NotationIconShape[]
> = {
  AddMeasureIcon: [
    {
      kind: "rect",
      x: 3,
      y: 7,
      width: 1.4,
      height: 10,
    },
    {
      kind: "rect",
      x: 14,
      y: 7,
      width: 1.4,
      height: 10,
    },
    {
      kind: "rect",
      x: 3,
      y: 11.3,
      width: 12.4,
      height: 1.2,
    },
    {
      kind: "rect",
      x: 16.4,
      y: 3.2,
      width: 6.4,
      height: 1.9,
      rx: 0.6,
    },
    {
      kind: "rect",
      x: 18.65,
      y: 0.95,
      width: 1.9,
      height: 6.4,
      rx: 0.6,
    },
  ],
  ArpeggioIcon: [
    {
      kind: "path",
      d: "M7 20c-2-2 2-4 0-6s2-4 0-6",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      kind: "circle",
      cx: 15,
      cy: 7,
      r: 2.1,
      fill: "currentColor",
    },
    {
      kind: "circle",
      cx: 15,
      cy: 13,
      r: 2.1,
      fill: "currentColor",
    },
    {
      kind: "circle",
      cx: 15,
      cy: 19,
      r: 2.1,
      fill: "currentColor",
    },
  ],
  ArticulationIcon: [
    {
      kind: "ellipse",
      cx: 12,
      cy: 17.2,
      rx: 3.6,
      ry: 2.55,
      transform: "rotate(-20 12 17.2)",
    },
    {
      kind: "path",
      d: "M5.4 6 L18.6 9.6 L18.6 11.8 L5.4 8.2 Z",
    },
    {
      kind: "path",
      d: "M18.6 9.6 L5.4 13.2 L5.4 11 L18.6 7.4 Z",
    },
  ],
  BeamBreakIcon: [
    {
      kind: "path",
      d: "M4 18V7M9 18V7M15 18V7M20 18V7",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
    },
    {
      kind: "path",
      d: "M4 7h5",
      stroke: "currentColor",
      strokeWidth: 2.6,
      strokeLinecap: "round",
    },
    {
      kind: "path",
      d: "M15 7h5",
      stroke: "currentColor",
      strokeWidth: 2.6,
      strokeLinecap: "round",
    },
    {
      kind: "path",
      d: "M12 4v5",
      stroke: "currentColor",
      strokeWidth: 1.4,
      strokeLinecap: "round",
      strokeDasharray: "1.5 1.8",
    },
  ],
  BeamNoneIcon: [
    {
      kind: "path",
      d: "M7 19V6M17 19V6",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
    },
    {
      kind: "path",
      d: "M7 6c3 1 4 3 3 5M17 6c3 1 4 3 3 5",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      kind: "circle",
      cx: 5,
      cy: 19,
      r: 1.9,
      fill: "currentColor",
    },
    {
      kind: "circle",
      cx: 15,
      cy: 19,
      r: 1.9,
      fill: "currentColor",
    },
  ],
  ChordIcon: [
    {
      kind: "ellipse",
      cx: 8.6,
      cy: 17.4,
      rx: 3.4,
      ry: 2.4,
      transform: "rotate(-20 8.6 17.4)",
    },
    {
      kind: "ellipse",
      cx: 8.6,
      cy: 14,
      rx: 3.4,
      ry: 2.4,
      transform: "rotate(-20 8.6 13.999999999999998)",
    },
    {
      kind: "ellipse",
      cx: 8.6,
      cy: 10.6,
      rx: 3.4,
      ry: 2.4,
      transform: "rotate(-20 8.6 10.599999999999998)",
    },
    {
      kind: "rect",
      x: 10.75,
      y: 3,
      width: 1.25,
      height: 7.6,
    },
  ],
  ContinuousLayoutIcon: [
    {
      kind: "rect",
      x: 2.4,
      y: 11.2,
      width: 19.2,
      height: 1.7,
      rx: 0.6,
    },
    {
      kind: "path",
      d: "M6.6 6.6 L2 12 L6.6 17.4 Z",
    },
    {
      kind: "path",
      d: "M17.4 6.6 L22 12 L17.4 17.4 Z",
    },
  ],
  CrescendoIcon: [
    {
      kind: "path",
      d: "M4 12L20 6M4 12l16 6",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
    },
  ],
  DeleteMeasureIcon: [
    {
      kind: "rect",
      x: 3,
      y: 7,
      width: 1.4,
      height: 10,
    },
    {
      kind: "rect",
      x: 14,
      y: 7,
      width: 1.4,
      height: 10,
    },
    {
      kind: "rect",
      x: 3,
      y: 11.3,
      width: 12.4,
      height: 1.2,
    },
    {
      kind: "path",
      d: "M15 19 L22 12",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
    },
  ],
  DiminuendoIcon: [
    {
      kind: "path",
      d: "M20 12L4 6M20 12L4 18",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
    },
  ],
  DottedIcon: [
    {
      kind: "ellipse",
      cx: 9,
      cy: 17.4,
      rx: 3.4,
      ry: 2.4,
      transform: "rotate(-20 9 17.4)",
    },
    {
      kind: "rect",
      x: 11.4,
      y: 4,
      width: 1.25,
      height: 13.4,
    },
    {
      kind: "circle",
      cx: 16.6,
      cy: 17.4,
      r: 1.7,
    },
  ],
  DoubleFlatIcon: [
    {
      kind: "rect",
      x: 3.9,
      y: 3.6,
      width: 1.25,
      height: 16,
      rx: 0.4,
    },
    {
      kind: "path",
      d: "M5.15 11.6\n            C8.387 10.2 9.791 13.4 7.529 16.1\n            C6.671 17.1 5.735 18.1 5.15 18.8\n            Z",
    },
    {
      kind: "rect",
      x: 11.6,
      y: 3.6,
      width: 1.25,
      height: 16,
      rx: 0.4,
    },
    {
      kind: "path",
      d: "M12.85 11.6\n            C16.087 10.2 17.491 13.4 15.229 16.1\n            C14.370999999999999 17.1 13.434999999999999 18.1 12.85 18.8\n            Z",
    },
  ],
  DoubleSharpIcon: [
    {
      kind: "path",
      d: "M4.8 4.8 L12 9.6 L19.2 4.8 L14.4 12 L19.2 19.2 L12 14.4 L4.8 19.2 L9.6 12 Z",
    },
  ],
  EighthNoteIcon: [
    {
      kind: "ellipse",
      cx: 8.6,
      cy: 17.4,
      rx: 3.6,
      ry: 2.55,
      transform: "rotate(-20 8.6 17.4)",
    },
    {
      kind: "rect",
      x: 10.75,
      y: 3,
      width: 1.25,
      height: 14.4,
    },
    {
      kind: "path",
      d: "M12 3\n          C16.2 4.5 17.7 6.6 16.6 8.4\n          C17.1 6.9 15.2 5.3 12 5.7\n          Z",
    },
  ],
  FermataIcon: [
    {
      kind: "path",
      d: "M4 12c2.5-6 13.5-6 16 0",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
    },
    {
      kind: "circle",
      cx: 12,
      cy: 8.5,
      r: 1.5,
      fill: "currentColor",
    },
    {
      kind: "circle",
      cx: 12,
      cy: 17.5,
      r: 2.6,
      fill: "currentColor",
    },
  ],
  FlatIcon: [
    {
      kind: "rect",
      x: 9,
      y: 3.6,
      width: 1.25,
      height: 16,
      rx: 0.4,
    },
    {
      kind: "path",
      d: "M10.25 11.6\n            C14.4 10.2 16.2 13.4 13.3 16.1\n            C12.2 17.1 11 18.1 10.25 18.8\n            Z",
    },
  ],
  GoToStartIcon: [
    {
      kind: "rect",
      x: 3.4,
      y: 5.4,
      width: 2.2,
      height: 13.2,
      rx: 0.6,
    },
    {
      kind: "path",
      d: "M13.4 5.4 L6.8 12 L13.4 18.6 Z",
    },
    {
      kind: "path",
      d: "M20.5 5.4 L13.9 12 L20.5 18.6 Z",
    },
  ],
  HalfNoteIcon: [
    {
      kind: "path",
      fillRule: "evenodd",
      d: "M5.22 18.63A3.6 2.55 -20 1 0 11.98 16.17A3.6 2.55 -20 1 0 5.22 18.63ZM6.25 18.26A2.5 1 -20 1 0 10.95 16.54A2.5 1 -20 1 0 6.25 18.26Z",
    },
    {
      kind: "rect",
      x: 10.75,
      y: 3,
      width: 1.25,
      height: 14.4,
    },
  ],
  InsertModeIcon: [
    {
      kind: "ellipse",
      cx: 4.6,
      cy: 17.4,
      rx: 2.6,
      ry: 1.9,
    },
    {
      kind: "ellipse",
      cx: 19.4,
      cy: 17.4,
      rx: 2.6,
      ry: 1.9,
    },
    {
      kind: "path",
      d: "M12 19 L12 6 M8.6 9.4 L12 6 L15.4 9.4",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  InsertNoteIcon: [
    {
      kind: "group",
      transform: "translate(-0.6 2) scale(0.86)",
      shapes: [
        {
          kind: "ellipse",
          cx: 8.6,
          cy: 17.4,
          rx: 3.6,
          ry: 2.55,
          transform: "rotate(-20 8.6 17.4)",
        },
        {
          kind: "rect",
          x: 10.75,
          y: 3,
          width: 1.25,
          height: 14.4,
        },
      ],
    },
    {
      kind: "rect",
      x: 16.4,
      y: 3.2,
      width: 6.4,
      height: 1.9,
      rx: 0.6,
    },
    {
      kind: "rect",
      x: 18.65,
      y: 0.95,
      width: 1.9,
      height: 6.4,
      rx: 0.6,
    },
  ],
  InsertRestIcon: [
    {
      kind: "group",
      transform: "translate(-1.2 1.4) scale(0.88)",
      shapes: [
        {
          kind: "path",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2.3,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M8.6 5.6 L14.4 11.2 L9.4 14.2 L13.6 18.2",
        },
        {
          kind: "path",
          d: "M13.9 17.7 C10.6 16.1 8.8 17.7 9.8 20.4 C7.4 18.2 7.6 14.4 11.6 15.3 Z",
        },
      ],
    },
    {
      kind: "rect",
      x: 16.4,
      y: 3.2,
      width: 6.4,
      height: 1.9,
      rx: 0.6,
    },
    {
      kind: "rect",
      x: 18.65,
      y: 0.95,
      width: 1.9,
      height: 6.4,
      rx: 0.6,
    },
  ],
  MetronomeIcon: [
    {
      kind: "path",
      d: "M9.2 3.4 L14.8 3.4 L18.6 20.6 L5.4 20.6 Z",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinejoin: "round",
    },
    {
      kind: "rect",
      x: 6.6,
      y: 16.4,
      width: 10.8,
      height: 1.6,
    },
    {
      kind: "path",
      d: "M15.8 6.6 L10.6 17 L9.1 16.3 L14.3 5.9 Z",
    },
    {
      kind: "rect",
      x: 11.9,
      y: 9.6,
      width: 3.4,
      height: 2.4,
      rx: 0.5,
      transform: "rotate(-24 13.6 10.8)",
    },
  ],
  NaturalIcon: [
    {
      kind: "rect",
      x: 8.2,
      y: 3,
      width: 1.2,
      height: 13.8,
    },
    {
      kind: "rect",
      x: 14.6,
      y: 7.2,
      width: 1.2,
      height: 13.8,
    },
    {
      kind: "path",
      d: "M8.2 9.9 L15.8 8.5 L15.8 10.4 L8.2 11.8 Z",
    },
    {
      kind: "path",
      d: "M8.2 14.5 L15.8 13.1 L15.8 15 L8.2 16.4 Z",
    },
  ],
  NextMeasureIcon: [
    {
      kind: "path",
      d: "M5.6 5.4 L15.4 12 L5.6 18.6 Z",
    },
    {
      kind: "rect",
      x: 17.2,
      y: 5.4,
      width: 2.2,
      height: 13.2,
      rx: 0.6,
    },
  ],
  OrnamentIcon: [
    {
      kind: "path",
      d: "M4 15c1.6-4 3.4-4 5 0s3.4 4 5 0 3.4-4 5 0",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      kind: "path",
      d: "M5 9h5M7.5 9V6",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
    },
  ],
  PageLayoutIcon: [
    {
      kind: "rect",
      x: 4,
      y: 3,
      width: 16,
      height: 18,
      rx: 1.8,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
    },
    {
      kind: "rect",
      x: 7,
      y: 7.4,
      width: 10,
      height: 1.6,
      rx: 0.6,
    },
    {
      kind: "rect",
      x: 7,
      y: 11.2,
      width: 10,
      height: 1.6,
      rx: 0.6,
    },
    {
      kind: "rect",
      x: 7,
      y: 15,
      width: 6.4,
      height: 1.6,
      rx: 0.6,
    },
  ],
  PreviousMeasureIcon: [
    {
      kind: "rect",
      x: 4.6,
      y: 5.4,
      width: 2.2,
      height: 13.2,
      rx: 0.6,
    },
    {
      kind: "path",
      d: "M18.4 5.4 L8.6 12 L18.4 18.6 Z",
    },
  ],
  QuantizeIcon: [
    {
      kind: "rect",
      x: 4.2,
      y: 3,
      width: 1.1,
      height: 18,
      rx: 0.4,
      opacity: 0.45,
    },
    {
      kind: "rect",
      x: 11.45,
      y: 3,
      width: 1.1,
      height: 18,
      rx: 0.4,
    },
    {
      kind: "rect",
      x: 18.7,
      y: 3,
      width: 1.1,
      height: 18,
      rx: 0.4,
      opacity: 0.45,
    },
    {
      kind: "ellipse",
      cx: 12,
      cy: 12,
      rx: 3.4,
      ry: 2.4,
      transform: "rotate(-20 12 12)",
    },
    {
      kind: "path",
      d: "M7.4 12 L10.1 9.9 L10.1 14.1 Z",
    },
  ],
  QuarterNoteIcon: [
    {
      kind: "ellipse",
      cx: 8.6,
      cy: 17.4,
      rx: 3.6,
      ry: 2.55,
      transform: "rotate(-20 8.6 17.4)",
    },
    {
      kind: "rect",
      x: 10.75,
      y: 3,
      width: 1.25,
      height: 14.4,
    },
  ],
  ReplaceModeIcon: [
    {
      kind: "ellipse",
      cx: 12,
      cy: 17.4,
      rx: 3.4,
      ry: 2.4,
    },
    {
      kind: "path",
      d: "M12 12.4 L12 4.5 M8.6 7.9 L12 4.5 L15.4 7.9",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  SelectAllIcon: [
    {
      kind: "rect",
      x: 3,
      y: 5,
      width: 18,
      height: 14,
      rx: 1.6,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeDasharray: "3.4 2.6",
    },
    {
      kind: "ellipse",
      cx: 9,
      cy: 14.2,
      rx: 2.2,
      ry: 1.6,
      transform: "rotate(-20 9 14.2)",
    },
    {
      kind: "rect",
      x: 10.8,
      y: 8.4,
      width: 0.9,
      height: 5.8,
    },
    {
      kind: "ellipse",
      cx: 15.4,
      cy: 14.2,
      rx: 2.2,
      ry: 1.6,
      transform: "rotate(-20 15.4 14.2)",
    },
    {
      kind: "rect",
      x: 17.2,
      y: 8.4,
      width: 0.9,
      height: 5.8,
    },
  ],
  SharpIcon: [
    {
      kind: "rect",
      x: 9,
      y: 4.2,
      width: 1.3,
      height: 15.6,
    },
    {
      kind: "rect",
      x: 13.7,
      y: 4.2,
      width: 1.3,
      height: 15.6,
    },
    {
      kind: "path",
      d: "M6.8 10.6 L17.2 8.9 L17.2 11.3 L6.8 13 Z",
    },
    {
      kind: "path",
      d: "M6.8 15 L17.2 13.3 L17.2 15.7 L6.8 17.4 Z",
    },
  ],
  SixteenthNoteIcon: [
    {
      kind: "ellipse",
      cx: 8.6,
      cy: 17.4,
      rx: 3.6,
      ry: 2.55,
      transform: "rotate(-20 8.6 17.4)",
    },
    {
      kind: "rect",
      x: 10.75,
      y: 3,
      width: 1.25,
      height: 14.4,
    },
    {
      kind: "path",
      d: "M12 3\n          C16.2 4.5 17.7 6.6 16.6 8.4\n          C17.1 6.9 15.2 5.3 12 5.7\n          Z",
    },
    {
      kind: "path",
      d: "M12 6\n          C16.2 7.5 17.7 9.6 16.6 11.4\n          C17.1 9.9 15.2 8.3 12 8.7\n          Z",
    },
  ],
  SlurIcon: [
    {
      kind: "path",
      d: "M6 15c2.5-5 9.5-5 12 0",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
    },
    {
      kind: "circle",
      cx: 6,
      cy: 17.5,
      r: 2.2,
      fill: "currentColor",
    },
    {
      kind: "circle",
      cx: 18,
      cy: 17.5,
      r: 2.2,
      fill: "currentColor",
    },
  ],
  SoloIcon: [
    {
      kind: "path",
      d: "M4.4 15.4 V12.6 a7.6 7.6 0 0 1 15.2 0 V15.4",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
    },
    {
      kind: "rect",
      x: 2.8,
      y: 13.6,
      width: 4.4,
      height: 7,
      rx: 2.2,
    },
    {
      kind: "rect",
      x: 16.8,
      y: 13.6,
      width: 4.4,
      height: 7,
      rx: 2.2,
    },
  ],
  SunMoonIcon: [
    {
      kind: "path",
      d: "M12 3.6 a8.4 8.4 0 0 0 0 16.8 Z",
    },
    {
      kind: "path",
      d: "M12 3.6 a8.4 8.4 0 0 1 0 16.8",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
    },
    {
      kind: "group",
      stroke: "currentColor",
      strokeWidth: 1.7,
      strokeLinecap: "round",
      shapes: [
        {
          kind: "path",
          d: "M12 1.4 V0.2 M12 23.8 V22.6 M4.1 4.1 L3.2 3.2 M4.1 19.9 L3.2 20.8 M1.4 12 H0.2",
        },
      ],
    },
  ],
  ThirtySecondNoteIcon: [
    {
      kind: "ellipse",
      cx: 8.6,
      cy: 17.4,
      rx: 3.6,
      ry: 2.55,
      transform: "rotate(-20 8.6 17.4)",
    },
    {
      kind: "rect",
      x: 10.75,
      y: 3,
      width: 1.25,
      height: 14.4,
    },
    {
      kind: "path",
      d: "M12 3\n          C16.2 4.5 17.7 6.6 16.6 8.4\n          C17.1 6.9 15.2 5.3 12 5.7\n          Z",
    },
    {
      kind: "path",
      d: "M12 6\n          C16.2 7.5 17.7 9.6 16.6 11.4\n          C17.1 9.9 15.2 8.3 12 8.7\n          Z",
    },
    {
      kind: "path",
      d: "M12 9\n          C16.2 10.5 17.7 12.6 16.6 14.4\n          C17.1 12.9 15.2 11.3 12 11.7\n          Z",
    },
  ],
  TieIcon: [
    {
      kind: "ellipse",
      cx: 6.4,
      cy: 16.4,
      rx: 2.9,
      ry: 2.1,
      transform: "rotate(-20 6.4 16.4)",
    },
    {
      kind: "ellipse",
      cx: 17.6,
      cy: 16.4,
      rx: 2.9,
      ry: 2.1,
      transform: "rotate(-20 17.6 16.4)",
    },
    {
      kind: "path",
      d: "M5.2 12.2 C8.2 4.9 15.8 4.9 18.8 12.2 C15.8 7.6 8.2 7.6 5.2 12.2 Z",
    },
  ],
  TripletIcon: [
    {
      kind: "text",
      x: 12,
      y: 9,
      textAnchor: "middle",
      fontSize: 9,
      fontStyle: "italic",
      fill: "currentColor",
      stroke: "none",
      content: "3",
    },
    {
      kind: "ellipse",
      cx: 5.5,
      cy: 19,
      rx: 2.3,
      ry: 1.7,
    },
    {
      kind: "ellipse",
      cx: 12,
      cy: 19,
      rx: 2.3,
      ry: 1.7,
    },
    {
      kind: "ellipse",
      cx: 18.5,
      cy: 19,
      rx: 2.3,
      ry: 1.7,
    },
    {
      kind: "rect",
      x: 4.5,
      y: 12.5,
      width: 15,
      height: 1.4,
    },
  ],
  WholeNoteIcon: [
    {
      kind: "path",
      fillRule: "evenodd",
      d: "M7.1 17.4A4.5 2.8 0 1 0 16.1 17.4A4.5 2.8 0 1 0 7.1 17.4ZM9.31 18.83A2.7 1.25 -32 1 0 13.89 15.97A2.7 1.25 -32 1 0 9.31 18.83Z",
    },
  ],
} as const;
