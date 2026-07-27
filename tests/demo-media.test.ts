import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const ids = [
  "afterdark",
  "nuit-35",
  "orbital-radio",
  "material-memory",
  "sans-titre-08",
];

test("ships five distinct, optimized MP4 loops and matching posters", async () => {
  const hashes = new Set<string>();

  for (const id of ids) {
    const videoPath = `public/media/florent/${id}-loop.mp4`;
    const posterPath = `public/media/florent/${id}-poster.jpg`;
    const video = await readFile(videoPath);
    const poster = await readFile(posterPath);
    const videoSize = (await stat(videoPath)).size;

    assert.equal(video.subarray(4, 8).toString("ascii"), "ftyp");
    assert.deepEqual([...poster.subarray(0, 3)], [0xff, 0xd8, 0xff]);
    assert.ok(videoSize > 50_000 && videoSize < 4_000_000);
    hashes.add(createHash("sha256").update(video).digest("hex"));
  }

  assert.equal(hashes.size, ids.length);
  await stat("public/media/florent/about-poster.jpg");
  await stat("public/og.png");
});
