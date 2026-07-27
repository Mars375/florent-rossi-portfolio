import type { Project } from "../../content/schema";

export type VideoSource =
  | { kind: "embed"; src: string }
  | { kind: "direct"; src: string };

function secureUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("Video URLs must use HTTPS.");
  }
  return url;
}

function vimeoId(url: URL): string {
  if (!["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname)) {
    throw new Error("Invalid Vimeo host.");
  }

  const id = url.pathname.match(/(?:video\/)?(\d+)(?:\/)?$/)?.[1];
  if (!id) throw new Error("Invalid Vimeo video URL.");
  return id;
}

function youtubeId(url: URL): string {
  let id = "";

  if (url.hostname === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (
    ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
  ) {
    id =
      url.searchParams.get("v") ??
      url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] ??
      "";
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
    throw new Error("Invalid YouTube video URL.");
  }
  return id;
}

export function parseVideoSource(
  value: string,
  provider: Project["fullVideo"]["provider"],
): VideoSource {
  const url = secureUrl(value);

  if (provider === "vimeo") {
    return {
      kind: "embed",
      src: `https://player.vimeo.com/video/${vimeoId(url)}`,
    };
  }

  if (provider === "youtube") {
    return {
      kind: "embed",
      src: `https://www.youtube-nocookie.com/embed/${youtubeId(url)}`,
    };
  }

  if (!url.pathname.toLowerCase().endsWith(".mp4")) {
    throw new Error("Direct films must be MP4 files.");
  }

  return { kind: "direct", src: url.toString() };
}
