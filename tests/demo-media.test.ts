import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
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
  ...ids.flatMap((id) => [
    `${id}-loop.mp4`,
    `${id}-poster.jpg`,
    `${id}-preview.gif`,
  ]),
  "about-poster.jpg",
];

test("requires an ffmpeg executable before inspecting generated media", () => {
  assert.throws(
    () => requireFfmpegPath(null),
    /ffmpeg-static did not provide an executable path/,
  );
});

function requireFfmpegPath(path: string | null): string {
  assert.ok(path, "ffmpeg-static did not provide an executable path");
  return path;
}

function inspectVideo(videoPath: string) {
  const result = spawnSync(
    requireFfmpegPath(ffmpegPath),
    ["-hide_banner", "-i", videoPath],
    { encoding: "utf8" },
  );

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
  const aboutFile = await readFile(`${outputDirectory}/about-poster.jpg`);
  const socialCard = await readFile("public/og.png");
  const socialCardMetadata = await sharp(socialCard).metadata();

  assert.equal(about.format, "jpeg");
  assert.equal(about.width, 1280);
  assert.equal(about.height, 720);
  assert.deepEqual([...aboutFile.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.deepEqual([...socialCard.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(socialCardMetadata.format, "png");
  assert.equal(socialCardMetadata.width, 1734);
  assert.equal(socialCardMetadata.height, 909);
});

test("ships five distinct optimized three-second GIF previews", async () => {
  const hashes = new Set<string>();

  for (const id of ids) {
    const gifPath = `${outputDirectory}/${id}-preview.gif`;
    const file = await readFile(gifPath);
    const fileSize = (await stat(gifPath)).size;
    const metadata = await sharp(gifPath, { animated: true }).metadata();
    const inspection = inspectVideo(gifPath);

    assert.match(file.subarray(0, 6).toString("ascii"), /^GIF8[79]a$/);
    assert.equal(metadata.format, "gif");
    assert.equal(metadata.width, 640);
    assert.equal(metadata.pageHeight, 360);
    assert.equal(metadata.pages, 24);
    assert.equal(metadata.height, metadata.pageHeight * metadata.pages);
    assert.equal(metadata.loop, 0);
    assert.ok(fileSize > 10_000 && fileSize <= 2_000_000);
    assert.match(inspection, /Duration: 00:00:03\.0[01]/);
    assert.match(inspection, /640x360.*8 fps/);
    hashes.add(createHash("sha256").update(file).digest("hex"));
  }

  assert.equal(hashes.size, ids.length);
});

test("content consumes the exact local media asset paths", async () => {
  const content = JSON.parse(await readFile("content/default.json", "utf8"));

  assert.equal(content.about.imageUrl, "/media/florent/about-poster.jpg");
  assert.deepEqual(
    content.projects.map(
      (project: {
        id: string;
        posterUrl: string;
        preview: { url: string; fallbackGifUrl: string };
        gallery: { type: string; url: string }[];
      }) => ({
        id: project.id,
        posterUrl: project.posterUrl,
        previewUrl: project.preview.url,
        fallbackGifUrl: project.preview.fallbackGifUrl,
        galleryUrl: project.gallery.find((item) => item.type === "video")?.url,
      }),
    ),
    ids.map((id) => ({
      id,
      posterUrl: `/media/florent/${id}-poster.jpg`,
      previewUrl: `/media/florent/${id}-loop.mp4`,
      fallbackGifUrl: `/media/florent/${id}-preview.gif`,
      galleryUrl: `/media/florent/${id}-loop.mp4`,
    })),
  );
});

test("generator is idempotent for committed production media", async () => {
  const beforeMedia = await checksums(outputDirectory, generatedNames);
  const beforeSocialCard = await checksums("public", ["og.png"]);
  const result = spawnSync(process.execPath, ["scripts/generate-demo-media.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await checksums(outputDirectory, generatedNames), beforeMedia);
  assert.deepEqual(await checksums("public", ["og.png"]), beforeSocialCard);
});

async function waitForTemporaryOutput(directory: string, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const names = await readdir(directory);
    const temporary = names.find((name) => /^\.afterdark-loop-\d+-\d+\.mp4$/.test(name));
    if (temporary) return join(directory, temporary);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 25));
  }
  throw new Error("FFmpeg did not start writing its adjacent temporary output");
}

test("SIGKILL preserves the destination and the next start removes its stale adjacent temporary", async () => {
  const directory = await mkdtemp(join(tmpdir(), "florent-media-generation-"));
  const loopPath = join(directory, "public", "media", "florent", "afterdark-loop.mp4");
  const unrelatedPath = join(directory, "public", "media", "florent", ".afterdark-loop-1-2.mp4.bak");
  const original = Buffer.from("existing production loop");
  await mkdir(join(directory, "public", "media", "florent"), { recursive: true });
  await writeFile(loopPath, original);
  await writeFile(unrelatedPath, "must not be removed");

  const child = spawn(process.execPath, [resolve("scripts/generate-demo-media.mjs")], {
    cwd: directory,
    stdio: "ignore",
  });
  const exited = new Promise<void>((resolveChild) => child.once("exit", () => resolveChild()));

  try {
    const temporary = await waitForTemporaryOutput(dirname(loopPath));
    child.kill("SIGKILL");
    await exited;

    assert.deepEqual(await readFile(loopPath), original);
    assert.equal((await stat(temporary)).isFile(), true);

    const recovery = spawn(process.execPath, [resolve("scripts/generate-demo-media.mjs")], {
      cwd: directory,
      stdio: "ignore",
    });
    const recovered = new Promise<void>((resolveChild) => recovery.once("exit", () => resolveChild()));
    try {
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        if (!(await readdir(dirname(loopPath))).includes(basename(temporary))) break;
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 25));
      }
      assert.equal((await readdir(dirname(loopPath))).includes(basename(temporary)), false);
      assert.deepEqual(await readFile(loopPath), original);
      assert.equal(await readFile(unrelatedPath, "utf8"), "must not be removed");
    } finally {
      recovery.kill("SIGKILL");
      await recovered;
    }
  } finally {
    child.kill("SIGKILL");
    await exited;
    await rm(directory, { recursive: true, force: true });
  }
});

test("generates the social card with the tracked Geist font rather than a host fallback", async () => {
  const [generator, font] = await Promise.all([
    readFile("scripts/generate-demo-media.mjs", "utf8"),
    stat("scripts/assets/Geist-Regular.ttf"),
  ]);

  assert.ok(font.size > 10_000);
  assert.match(generator, /scripts\/assets\/Geist-Regular\.ttf|assets[\\/]Geist-Regular\.ttf/);
  assert.match(generator, /data:font\/ttf;base64/);
  assert.doesNotMatch(generator, /Arial|Helvetica|sans-serif/);
  assert.doesNotMatch(generator, /node_modules/);
});

test("ships the Geist OFL license and pinned font provenance", async () => {
  const [license, provenance] = await Promise.all([
    readFile("scripts/assets/Geist-OFL-1.1.txt", "utf8"),
    readFile("scripts/assets/Geist-Regular.provenance.md", "utf8"),
  ]);

  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(license, /Copyright \(c\) 2023 Vercel/);
  assert.match(provenance, /Geist/i);
  assert.match(provenance, /SIL Open Font License 1\.1/i);
  assert.match(provenance, /node_modules[\\/]next[\\/]dist[\\/]compiled[\\/]@vercel[\\/]og[\\/]Geist-Regular\.ttf/);
  assert.match(provenance, /BDE046DDD9F20BE35B0BD56CC79EB752B967FB6661A3FE76CB067BB09F871D76/);
});
