import assert from "node:assert/strict";
import test from "node:test";
import {
  mediaObjectPath,
  validateMediaFile,
} from "../lib/content/media";

const file = (name: string, type: string, size: number) => ({
  name,
  type,
  size,
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
