import { describe, expect, it } from "vitest";
import {
  DOCUMENT_EXTENSION,
  DOCUMENT_EXTENSIONS,
  PROJECT_FILE_VERSION,
} from "../../index";

describe("project file vocabulary", () => {
  it("writes .moo and opens every extension a project has been saved under", () => {
    expect(DOCUMENT_EXTENSION).toBe("moo");
    expect(DOCUMENT_EXTENSIONS).toEqual(["moo", "moosiac", "json"]);
    expect(DOCUMENT_EXTENSIONS[0]).toBe(DOCUMENT_EXTENSION);
  });

  it("is at version 1", () => {
    expect(PROJECT_FILE_VERSION).toBe(1);
  });
});
