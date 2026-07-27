import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  mediaObjectPath,
  unusedPortfolioMediaPaths,
  validateMediaFile,
} from "../lib/content/media";
import { defaultContent } from "../lib/content/fallback";

const file = (name: string, type: string, size: number) => ({
  name,
  type,
  size,
});

test("draft media removal never deletes a public object immediately", async () => {
  const source = await readFile(
    "app/admin/components/MediaUploader.tsx",
    "utf8",
  );
  assert.doesNotMatch(source, /\.remove\(/);
});

test("accepts optimized portfolio media and rejects oversized files", () => {
  assert.deepEqual(validateMediaFile(file("loop.mp4", "video/mp4", 5_000_000)), {
    kind: "preview",
    extension: "mp4",
  });
  assert.deepEqual(validateMediaFile(file("fallback.gif", "image/gif", 900_000)), {
    kind: "gif",
    extension: "gif",
  });
  assert.throws(
    () => validateMediaFile(file("huge.mp4", "video/mp4", 26 * 1024 * 1024)),
    /25 MB/i,
  );
  assert.throws(() =>
    validateMediaFile(file("script.svg", "image/svg+xml", 1_000)),
  );
});

test("builds a safe project-scoped object path", () => {
  assert.equal(
    mediaObjectPath("nuit-35", file("Böucle FINALE!!.webm", "video/webm", 100), 42),
    "projects/nuit-35/42-boucle-finale.webm",
  );
  assert.throws(() =>
    mediaObjectPath("../escape", file("loop.mp4", "video/mp4", 100), 42),
  );
});

test("deletes only project media no longer referenced after publication", () => {
  const projectUrl = "https://portfolio.supabase.co";
  const mediaUrl =
    `${projectUrl}/storage/v1/object/public/portfolio-media/` +
    "projects/afterdark/42-old-loop.mp4";
  const draft = structuredClone(defaultContent);

  assert.deepEqual(
    unusedPortfolioMediaPaths([mediaUrl], draft, projectUrl),
    ["projects/afterdark/42-old-loop.mp4"],
  );

  draft.projects[0].preview.url = mediaUrl;
  assert.deepEqual(
    unusedPortfolioMediaPaths([mediaUrl], draft, projectUrl),
    [],
  );

  assert.deepEqual(
    unusedPortfolioMediaPaths(
      ["https://evil.example/storage/v1/object/public/portfolio-media/x.mp4"],
      draft,
      projectUrl,
    ),
    [],
  );
});
