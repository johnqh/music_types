import { describe, expect, it } from "vitest";
import { GM_INSTRUMENTS } from "./gm";
import { GM_KITS } from "./gm-kit";
import { INSTRUMENT_OPTIONS } from "./instrument-options";
import { gmKitSpatialModel, gmSpatialModelFor, KIT_SPATIAL_MODELS, PROGRAM_SPATIAL_MODELS } from "./gm-spatial-model";
import type { InstrumentSpatialModel } from "./spatial-art";
import { trackSpatialModel } from "./track-instrument";

/** Every distinct model, so shape checks run once per model rather than once per program. */
function allModels(): Map<string, InstrumentSpatialModel> {
  const models = new Map<string, InstrumentSpatialModel>();
  for (const model of Object.values(PROGRAM_SPATIAL_MODELS)) models.set(model.id, model);
  for (const model of Object.values(KIT_SPATIAL_MODELS)) models.set(model.id, model);
  return models;
}

describe("coverage", () => {
  it("has a program-level model for every one of the 128 General MIDI programs", () => {
    // Every instrument the picker offers — no family fallback standing in.
    for (const option of INSTRUMENT_OPTIONS) {
      expect(PROGRAM_SPATIAL_MODELS[Number(option.value)], `program ${option.value} (${option.label})`).toBeDefined();
    }
    expect(Object.keys(PROGRAM_SPATIAL_MODELS)).toHaveLength(128);
  });

  it("has a model for every one of the 8 drum kits", () => {
    for (const kit of GM_KITS) expect(KIT_SPATIAL_MODELS[kit.program], kit.name).toBeDefined();
    expect(Object.keys(KIT_SPATIAL_MODELS)).toHaveLength(GM_KITS.length);
  });

  it("gives every program and kit a model with strokes", () => {
    for (const instrument of GM_INSTRUMENTS) expect(gmSpatialModelFor(instrument.program).model.strokes.length).toBeGreaterThan(0);
    for (const kit of GM_KITS) expect(gmKitSpatialModel(kit.program).model.strokes.length).toBeGreaterThan(0);
  });

  it("still answers for a program outside the range rather than returning nothing", () => {
    expect(gmSpatialModelFor(-1).model.strokes.length).toBeGreaterThan(0);
    expect(gmSpatialModelFor(999).model.strokes.length).toBeGreaterThan(0);
  });
});

describe("every model is well formed", () => {
  it("has only finite coordinates and strokes of at least two points", () => {
    for (const [id, model] of allModels()) {
      expect(model.strokes.length, id).toBeGreaterThan(0);
      for (const stroke of model.strokes) {
        expect(stroke.length, id).toBeGreaterThanOrEqual(2);
        for (const p of stroke) for (const c of p) expect(Number.isFinite(c), `${id} has a non-finite coordinate`).toBe(true);
      }
    }
  });

  it("sits on a plausible stage: within 1.6 m of the player sideways, on or above the floor, under 4 m tall", () => {
    // In meters, player at the origin. The pipe organ's façade is the
    // tallest thing here (3.8 m); string sections and the choir the widest.
    for (const [id, model] of allModels()) {
      for (const stroke of model.strokes) {
        for (const [x, y, z] of stroke) {
          expect(Math.abs(x), `${id} x`).toBeLessThanOrEqual(1.6);
          expect(y, `${id} y`).toBeGreaterThanOrEqual(-0.03);
          expect(y, `${id} y`).toBeLessThanOrEqual(4.0);
          expect(Math.abs(z), `${id} z`).toBeLessThanOrEqual(2.8);
        }
      }
    }
  });

  it("is instrument-sized, not icon-sized: every model spans at least 10 cm on some axis", () => {
    for (const [id, model] of allModels()) {
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      for (const stroke of model.strokes)
        for (const p of stroke)
          for (let axis = 0; axis < 3; axis++) {
            min[axis] = Math.min(min[axis], p[axis]);
            max[axis] = Math.max(max[axis], p[axis]);
          }
      const span = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
      expect(span, id).toBeGreaterThanOrEqual(0.1);
    }
  });
});

describe("played poses", () => {
  const top = (model: InstrumentSpatialModel) => Math.max(...model.strokes.flatMap((s) => s.map((p) => p[1])));
  const bottom = (model: InstrumentSpatialModel) => Math.min(...model.strokes.flatMap((s) => s.map((p) => p[1])));

  it("holds the violin and viola at chin height, and points them forward-left", () => {
    for (const program of [40, 41]) {
      const { model } = gmSpatialModelFor(program);
      expect(top(model)).toBeGreaterThan(1.3);
      expect(bottom(model)).toBeGreaterThan(1.0);
      // The scroll end reaches further to the player's left (−x) than the body sits.
      const minX = Math.min(...model.strokes.flatMap((s) => s.map((p) => p[0])));
      expect(minX).toBeLessThan(-0.4);
    }
  });

  it("stands the cello and bass on the floor with their scrolls above the player's shoulders", () => {
    for (const program of [42, 43, 32]) {
      const { model } = gmSpatialModelFor(program);
      expect(bottom(model)).toBeLessThan(0.1);
      expect(top(model)).toBeGreaterThan(1.3);
    }
  });

  it("puts a grand piano's keys at 72 cm and its lid well above the rim", () => {
    const { model } = gmSpatialModelFor(0);
    expect(top(model)).toBeGreaterThan(1.5);
    expect(bottom(model)).toBeLessThan(0.05);
  });

  it("raises wind instruments to the lips", () => {
    for (const program of [56, 57, 60, 64, 65, 71, 72, 73, 74, 77, 78]) {
      const { model } = gmSpatialModelFor(program);
      expect(top(model), `program ${program}`).toBeGreaterThan(1.4);
    }
  });

  it("distinguishes physically different guitars, basses and saxophones", () => {
    const ids = (programs: number[]) => new Set(programs.map((p) => gmSpatialModelFor(p).model.id));
    expect(ids([24, 25, 26, 27, 28, 29, 30]).size).toBe(7);
    expect(ids([33, 34, 35, 36]).size).toBe(4);
    expect(ids([64, 65, 66, 67]).size).toBe(4);
  });

  it("shares one model where two programs are the same physical instrument", () => {
    expect(gmSpatialModelFor(0).model).toBe(gmSpatialModelFor(1).model); // both a grand piano
    expect(gmSpatialModelFor(16).model).toBe(gmSpatialModelFor(17).model); // both a Hammond
    expect(gmSpatialModelFor(80).model).toBe(gmSpatialModelFor(81).model); // both a monosynth
  });
});

describe("kits", () => {
  it("draws the TR-808 as the drum machine, not as a drum set", () => {
    expect(gmKitSpatialModel(25).model.id).toBe("tr-808");
    expect(gmKitSpatialModel(25).model.strokes.length).toBeLessThan(gmKitSpatialModel(0).model.strokes.length);
  });

  it("gives every kit its own model", () => {
    expect(new Set(GM_KITS.map((kit) => gmKitSpatialModel(kit.program).model.id)).size).toBe(GM_KITS.length);
  });

  it("falls back to the standard kit for an address no kit defines", () => {
    expect(gmKitSpatialModel(999).model.id).toBe("standard-kit");
  });
});

describe("trackSpatialModel", () => {
  it("resolves a percussion track through the kit table, not the melodic one", () => {
    // Program 40 on a percussion track is Brush Kit's address, not Violin.
    expect(trackSpatialModel({ clef: "percussion", midiProgram: 40 }).model.id).toBe("brush-kit");
  });

  it("resolves a melodic track through the instrument table", () => {
    expect(trackSpatialModel({ clef: "treble", midiProgram: 40 }).model.id).toBe("violin");
  });
});
