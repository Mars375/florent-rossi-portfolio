import assert from "node:assert/strict";
import test from "node:test";
import content from "../content/default.json";
import { defaultLegalContent } from "../content/legal";
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

  const traversal = structuredClone(local);
  traversal.projects[0].preview.url = "/media/florent/../outside.mp4";
  assert.throws(() => parsePortfolioContent(traversal), /media|path|url/i);

  const query = structuredClone(local);
  query.projects[0].preview.url = "/media/florent/afterdark-loop.mp4?version=1";
  assert.throws(() => parsePortfolioContent(query), /media|path|url/i);

  const fragment = structuredClone(local);
  fragment.projects[0].preview.url = "/media/florent/afterdark-loop.mp4#preview";
  assert.throws(() => parsePortfolioContent(fragment), /media|path|url/i);

  const remoteMedia = structuredClone(local);
  remoteMedia.projects[0].preview.url =
    "https://example.supabase.co/storage/v1/object/public/media/florent/afterdark-loop.mp4";
  assert.doesNotThrow(() => parsePortfolioContent(remoteMedia));
});

test("adds complete legal defaults to a legacy version-one document", () => {
  const legacy = structuredClone(content) as Record<string, unknown>;
  delete legacy.legal;

  const parsed = parsePortfolioContent(legacy);

  assert.deepEqual(parsed.legal, defaultLegalContent);
  assert.equal(parsed.schemaVersion, 1);
});

test("keeps JSON legal defaults aligned with the typed defaults", () => {
  const parsed = parsePortfolioContent(content);
  assert.deepEqual(parsed.legal, defaultLegalContent);
});

test("ships editable LinkedIn, Instagram and Vimeo defaults", () => {
  const parsed = parsePortfolioContent(content);
  assert.deepEqual(
    parsed.site.socials.map(({ label, url }) => ({ label, url })),
    [
      { label: "LinkedIn", url: "https://www.linkedin.com/" },
      { label: "Instagram", url: "https://www.instagram.com/" },
      { label: "Vimeo", url: "https://vimeo.com/" },
    ],
  );
});

test("rejects unsafe legal host URLs and malformed update dates", () => {
  const unsafeHost = structuredClone(content);
  unsafeHost.legal.host.url = "http://example.com";
  assert.throws(() => parsePortfolioContent(unsafeHost), /https/i);

  const invalidDate = structuredClone(content);
  invalidDate.legal.updatedAt = "28/07/2026";
  assert.throws(() => parsePortfolioContent(invalidDate), /date|YYYY-MM-DD/i);
});
