import assert from "node:assert/strict";
import test from "node:test";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";
import {
  canActivateAnimatedPreview,
  projectPreviewGifUrl,
  projectPreviewSources,
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

test("prefers MP4 with GIF fallback for project-card motion", () => {
  assert.deepEqual(projectPreviewSources(project), {
    videoUrl: "/media/florent/afterdark-loop.mp4",
    gifUrl: "/media/florent/afterdark-preview.gif",
  });
});

test("activates motion from real mouse or focus but not touch or reduced motion", () => {
  const eligible = {
    videoUrl: "/media/florent/afterdark-loop.mp4",
    gifUrl: "/media/florent/afterdark-preview.gif",
    reducedMotion: false,
  };

  assert.equal(
    canActivateAnimatedPreview({ ...eligible, interaction: "mouse" }),
    true,
  );
  assert.equal(
    canActivateAnimatedPreview({ ...eligible, interaction: "focus" }),
    true,
  );
  assert.equal(
    canActivateAnimatedPreview({ ...eligible, interaction: "touch" }),
    false,
  );
  assert.equal(
    canActivateAnimatedPreview({
      ...eligible,
      interaction: "mouse",
      reducedMotion: true,
    }),
    false,
  );
  assert.equal(
    canActivateAnimatedPreview({
      videoUrl: "",
      gifUrl: "",
      interaction: "mouse",
      reducedMotion: false,
    }),
    false,
  );
});
