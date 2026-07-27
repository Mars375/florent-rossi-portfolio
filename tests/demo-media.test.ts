import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const ids = [
  "afterdark",
  "nuit-35",
  "orbital-radio",
  "material-memory",
  "sans-titre-08",
];

const outputDirectory = "public/media/florent";
const generatedNames = [
  ...ids.flatMap((id) => [`${id}-loop.mp4`, `${id}-poster.jpg`]),
  "about-poster.jpg",
];

function inspectVideo(videoPath: string) {
  const result = spawnSync(ffmpegPath, ["-hide_banner", "-i", videoPath], {
    encoding: "utf8",
  });

  assert.equal(result.status, 1, result.stderr);
  return `${result.stdout}\n${result.stderr}`;
}

async function checksums(directory: string, names: string[]) {
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [
        name,
        createHash("sha256").update(await readFile(join(directory, name))).digest("hex"),
      ]),
    ),
  );
}

test("ships five distinct, optimized MP4 loops and matching posters", async () => {
  const hashes = new Set<string>();

  for (const id of ids) {
    const videoPath = `${outputDirectory}/${id}-loop.mp4`;
    const posterPath = `${outputDirectory}/${id}-poster.jpg`;
    const video = await readFile(videoPath);
    const poster = await readFile(posterPath);
    const videoSize = (await stat(videoPath)).size;
    const metadata = inspectVideo(videoPath);
    const posterMetadata = await sharp(posterPath).metadata();

    assert.equal(video.subarray(4, 8).toString("ascii"), "ftyp");
    assert.deepEqual([...poster.subarray(0, 3)], [0xff, 0xd8, 0xff]);
    assert.ok(videoSize > 50_000 && videoSize < 4_000_000);
    assert.match(metadata, /Duration: 00:00:06\.00/);
    assert.match(metadata, /Video: h264 .*\(avc1 \/ 0x31637661\).*1280x720.*30 fps/);
    assert.equal(posterMetadata.format, "jpeg");
    assert.equal(posterMetadata.width, 1280);
    assert.equal(posterMetadata.height, 720);
    hashes.add(createHash("sha256").update(video).digest("hex"));
  }

  assert.equal(hashes.size, ids.length);
  const about = await sharp(`${outputDirectory}/about-poster.jpg`).metadata();
  const socialCard = await readFile("public/og.png");
  const socialCardMetadata = await sharp(socialCard).metadata();

  assert.equal(about.format, "jpeg");
  assert.equal(about.width, 1280);
  assert.equal(about.height, 720);
  assert.deepEqual([...socialCard.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(socialCardMetadata.format, "png");
  assert.equal(socialCardMetadata.width, 1734);
  assert.equal(socialCardMetadata.height, 909);
});

test("content consumes the exact local media asset paths", async () => {
  const content = JSON.parse(await readFile("content/default.json", "utf8"));

  assert.equal(content.about.imageUrl, "/media/florent/about-poster.jpg");
  assert.deepEqual(
    content.projects.map(
      (project: {
        id: string;
        posterUrl: string;
        preview: { url: string };
        gallery: { type: string; url: string }[];
      }) => ({
        id: project.id,
        posterUrl: project.posterUrl,
        previewUrl: project.preview.url,
        galleryUrl: project.gallery.find((item) => item.type === "video")?.url,
      }),
    ),
    ids.map((id) => ({
      id,
      posterUrl: `/media/florent/${id}-poster.jpg`,
      previewUrl: `/media/florent/${id}-loop.mp4`,
      galleryUrl: `/media/florent/${id}-loop.mp4`,
    })),
  );
});

test("generator produces identical outputs when repeated with repository dependencies", async () => {
  const temporaryDirectory = await mkdtemp(join("public/media/", "florent-media-test-"));
  const outputNames = [...generatedNames, "og.png"];

  try {
    const generate = () => {
      const result = spawnSync(process.execPath, ["scripts/generate-demo-media.mjs"], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          DEMO_MEDIA_DURATION: "0.1",
          DEMO_MEDIA_OUTPUT_DIRECTORY: temporaryDirectory,
          DEMO_MEDIA_OG_PATH: join(temporaryDirectory, "og.png"),
          DEMO_MEDIA_POSTER_TIME: "0",
        },
      });

      assert.equal(result.status, 0, result.stderr);
    };

    generate();
    const firstRun = await checksums(temporaryDirectory, outputNames);
    generate();
    assert.deepEqual(await checksums(temporaryDirectory, outputNames), firstRun);
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
});
