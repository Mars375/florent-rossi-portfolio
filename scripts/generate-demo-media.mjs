import { copyFile, mkdir, readFile, rename, rm } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const outputDirectory = "public/media/florent";

const loops = [
  {
    id: "afterdark",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='20+25*sin((X+T*140)/70)':g='15+35*sin((Y-T*80)/90)':b='150+105*sin((X+Y+T*180)/110)'",
  },
  {
    id: "nuit-35",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='205+45*sin((X+T*95)/42)':g='170+35*sin((Y+T*45)/75)':b='145+30*sin((X-Y+T*120)/88)'",
  },
  {
    id: "orbital-radio",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='80+70*sin(hypot(X-W/2,Y-H/2)/28-T*5)':g='35+95*sin(hypot(X-W/2,Y-H/2)/38-T*4)':b='185+60*sin(hypot(X-W/2,Y-H/2)/50-T*6)'",
  },
  {
    id: "material-memory",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='155+70*sin((X+Y+T*35)/145)':g='130+75*sin((X-Y-T*55)/125)':b='90+55*sin((Y+T*65)/105)'",
  },
  {
    id: "sans-titre-08",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='120+115*sin((X+T*220)/32)':g='120+115*sin((Y-T*180)/37)':b='120+115*sin((X+Y+T*260)/44)'",
  },
];

function runFfmpeg(args) {
  const result = spawnSync(ffmpegPath, ["-y", ...args], { stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`ffmpeg exited with status ${result.status}`);
  }
}

function temporaryOutputPath(outputPath) {
  const extension = extname(outputPath);
  const name = basename(outputPath, extension);
  return join(dirname(outputPath), `.${name}-${process.pid}-${Date.now()}${extension}`);
}

async function writeAtomically(outputPath, write) {
  const temporaryPath = temporaryOutputPath(outputPath);

  try {
    await write(temporaryPath);
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function generateLoop({ id, source }) {
  const videoPath = join(outputDirectory, `${id}-loop.mp4`);
  const posterPath = join(outputDirectory, `${id}-poster.jpg`);
  const gifPath = join(outputDirectory, `${id}-preview.gif`);

  await writeAtomically(videoPath, async (temporaryPath) => {
    runFfmpeg([
      "-f",
      "lavfi",
      "-i",
      source,
      "-t",
      "6",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "24",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      temporaryPath,
    ]);
  });

  await writeAtomically(posterPath, async (temporaryPath) => {
    runFfmpeg([
      "-ss",
      "1",
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      temporaryPath,
    ]);
  });

  await writeAtomically(gifPath, async (temporaryPath) => {
    runFfmpeg([
      "-i",
      videoPath,
      "-t",
      "3",
      "-an",
      "-vf",
      "fps=8,scale=640:-2:flags=lanczos,split[frames][paletteInput];[paletteInput]palettegen=max_colors=64:stats_mode=diff[palette];[frames][palette]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
      "-loop",
      "0",
      temporaryPath,
    ]);
  });
}

async function socialCard() {
  const font = await readFile("scripts/assets/Geist-Regular.ttf");
  const fontDataUrl = `data:font/ttf;base64,${font.toString("base64")}`;

  return `
<svg width="1734" height="909" viewBox="0 0 1734 909" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>@font-face { font-family: "Geist"; src: url("${fontDataUrl}") format("truetype"); }</style>
  </defs>
  <rect width="1734" height="909" fill="#f2efe6"/>
  <rect x="1030" y="0" width="704" height="909" fill="#dfff00"/>
  <circle cx="1370" cy="438" r="280" fill="#2600ff"/>
  <g fill="#000000" font-family="Geist" font-weight="900">
    <text x="90" y="165" font-size="104" letter-spacing="-5">FLORENT ROSSI</text>
    <text x="95" y="265" font-size="52" letter-spacing="3">ART DIRECTOR</text>
    <text x="90" y="620" font-size="124" letter-spacing="-6">IDEAS MOVE.</text>
    <text x="90" y="745" font-size="124" letter-spacing="-6">IMAGES SPEAK.</text>
  </g>
</svg>`;
}

async function main() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide an executable path");
  }

  await mkdir(outputDirectory, { recursive: true });

  for (const loop of loops) {
    await generateLoop(loop);
  }

  await writeAtomically(join(outputDirectory, "about-poster.jpg"), (temporaryPath) =>
    copyFile(join(outputDirectory, "material-memory-poster.jpg"), temporaryPath),
  );

  await mkdir(dirname("public/og.png"), { recursive: true });
  await writeAtomically("public/og.png", async (temporaryPath) =>
    sharp(Buffer.from(await socialCard())).png().toFile(temporaryPath),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
