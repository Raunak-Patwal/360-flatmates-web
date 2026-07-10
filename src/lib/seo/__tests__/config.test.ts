import { describe, it, expect } from "vitest";
import { SITE_URL } from "../config";

describe("SEO Config SITE_URL", () => {
  it("points to the correct flatmates subdomain", () => {
    expect(SITE_URL).toBe("https://flatmates.360ghar.com");
  });
});
