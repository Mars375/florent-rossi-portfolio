import assert from "node:assert/strict";
import test from "node:test";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";
import {
  canUseAnimatedPreview,
  projectPreviewGifUrl,
} from "../lib/content/preview";

const project = parsePortfolioContent(content).projects[0];

test("selects the fallback GIF without replacing the MP4 content URL", () => {
  const withGif = structuredClone(project);
  withGif.preview.fallbackGifUrl =
    "/media/florent/afterdark-preview.gif";

  assert.equal(
    projectPreviewGifUrl(withGif),
    "/media/florent/afterdark-preview.gif",
  );
  assert.equal(withGif.preview.url, "/media/florent/afterdark-loop.mp4");
});

test("supports a direct GIF preview and safely accepts no GIF", () => {
  const directGif = structuredClone(project);
  directGif.preview.type = "gif";
  directGif.preview.url = "https://cdn.example.com/preview.gif";
  directGif.preview.fallbackGifUrl = "";

  const posterOnly = structuredClone(project);
  posterOnly.preview.fallbackGifUrl = "";

  assert.equal(
    projectPreviewGifUrl(directGif),
    "https://cdn.example.com/preview.gif",
  );
  assert.equal(projectPreviewGifUrl(posterOnly), "");
});

test("permits animation only with GIF, hover, fine pointer and full motion", () => {
  const eligible = {
    gifUrl: "/media/florent/afterdark-preview.gif",
    canHover: true,
    finePointer: true,
    reducedMotion: false,
  };

  assert.equal(canUseAnimatedPreview(eligible), true);
  assert.equal(canUseAnimatedPreview({ ...eligible, gifUrl: "" }), false);
  assert.equal(canUseAnimatedPreview({ ...eligible, canHover: false }), false);
  assert.equal(
    canUseAnimatedPreview({ ...eligible, finePointer: false }),
    false,
  );
  assert.equal(
    canUseAnimatedPreview({ ...eligible, reducedMotion: true }),
    false,
  );
});
