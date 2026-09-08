import { describe, expect, it } from "vitest";
import type { GenerateScoreRequest, RegenerateRegionRequest } from "./generation.js";
import { withGenerationVariant } from "./generation.js";

/**
 * The generation backend rides on the request, and only when it is not the
 * default — so an ordinary generation is exactly what it was before backends
 * could be chosen.
 */
describe("withGenerationVariant", () => {
  const base = {
    prompt: "p",
    durationMeasures: 8,
    tracks: [],
  } as unknown as GenerateScoreRequest;

  it("sends no field for the default", () => {
    expect(withGenerationVariant(base, "default")).not.toHaveProperty("variant");
    expect(withGenerationVariant(base, undefined)).not.toHaveProperty("variant");
    expect(withGenerationVariant(base, "")).not.toHaveProperty("variant");
  });

  it("tags the request with any other backend", () => {
    expect(withGenerationVariant(base, "deepseek").variant).toBe("deepseek");
    expect(withGenerationVariant(base, "weak").variant).toBe("weak");
  });

  it("leaves the rest of the request alone", () => {
    const tagged = withGenerationVariant(base, "deepseek");
    expect(tagged.prompt).toBe("p");
    expect(tagged.durationMeasures).toBe(8);
    // A new object, so a caller's request is never mutated under it.
    expect(tagged).not.toBe(base);
  });

  // The point of making it generic: a region replacement chooses its backend
  // the same way a whole score does.
  it("tags a regeneration request too", () => {
    const region = {
      scoreId: "s",
      instruction: "louder",
      candidateCount: 1,
    } as unknown as RegenerateRegionRequest;
    expect(withGenerationVariant(region, "local").variant).toBe("local");
    expect(withGenerationVariant(region, "default")).not.toHaveProperty(
      "variant",
    );
  });
});
