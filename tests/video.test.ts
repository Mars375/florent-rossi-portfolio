import assert from "node:assert/strict";
import test from "node:test";
import { parseVideoSource } from "../lib/content/video";

test("parses Vimeo video links", () => {
  assert.deepEqual(parseVideoSource("https://vimeo.com/76979871", "vimeo"), {
    kind: "embed",
    src: "https://player.vimeo.com/video/76979871",
  });
});

test("parses privacy-friendly YouTube embeds", () => {
  assert.deepEqual(
    parseVideoSource("https://youtu.be/M7lc1UVf-VE", "youtube"),
    {
      kind: "embed",
      src: "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
    },
  );
});

test("accepts only secure direct MP4 URLs", () => {
  assert.deepEqual(
    parseVideoSource(
      "https://cdn.example.com/films/campaign.mp4?version=2",
      "mp4",
    ),
    {
      kind: "direct",
      src: "https://cdn.example.com/films/campaign.mp4?version=2",
    },
  );
  assert.throws(() => parseVideoSource("javascript:alert(1)", "mp4"));
  assert.throws(() =>
    parseVideoSource("https://cdn.example.com/film.mov", "mp4"),
  );
});

