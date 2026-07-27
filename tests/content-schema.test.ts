import assert from "node:assert/strict";
import test from "node:test";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";

test("accepts the complete bilingual default portfolio", () => {
  const parsed = parsePortfolioContent(content);

  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.projects.length, 5);
  assert.ok(
    parsed.projects.every(
      (project) => project.title.en && project.title.fr,
    ),
  );
});

test("rejects duplicate slugs", () => {
  const invalid = structuredClone(content);
  invalid.projects[1].slug = invalid.projects[0].slug;

  assert.throws(() => parsePortfolioContent(invalid), /slug/i);
});

test("rejects missing translations", () => {
  const invalid = structuredClone(content);
  invalid.projects[0].title.fr = "";

  assert.throws(() => parsePortfolioContent(invalid), /translation/i);
});

test("rejects executable links and provider-mismatched videos", () => {
  const unsafeLink = structuredClone(content);
  unsafeLink.site.socials[0].url = "javascript:alert(1)";
  assert.throws(() => parsePortfolioContent(unsafeLink), /https/i);

  const invalidVideo = structuredClone(content);
  invalidVideo.projects[0].fullVideo.url = "https://vimeo.com/";
  assert.throws(() => parsePortfolioContent(invalidVideo), /vimeo|video/i);
});
