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

test("accepts versioned local media but rejects protocol-relative paths", () => {
  const local = structuredClone(content);
  local.about.imageUrl = "/media/florent/about-poster.jpg";
  local.projects[0].posterUrl = "/media/florent/afterdark-poster.jpg";
  local.projects[0].preview.url = "/media/florent/afterdark-loop.mp4";
  local.projects[0].gallery[0].url = "/media/florent/afterdark-loop.mp4";
  assert.doesNotThrow(() => parsePortfolioContent(local));

  const unsafe = structuredClone(local);
  unsafe.projects[0].preview.url = "//evil.example/loop.mp4";
  assert.throws(() => parsePortfolioContent(unsafe), /media|path|url/i);
});
