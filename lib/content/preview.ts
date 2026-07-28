import type { Project } from "../../content/schema";

export type PreviewInteraction = "mouse" | "focus" | "touch";

export function projectPreviewGifUrl(project: Project): string {
  if (project.preview.fallbackGifUrl) {
    return project.preview.fallbackGifUrl;
  }

  return project.preview.type === "gif" ? project.preview.url : "";
}

export function projectPreviewSources(project: Project) {
  return {
    videoUrl: project.preview.type === "video" ? project.preview.url : "",
    gifUrl: projectPreviewGifUrl(project),
  };
}

export function canActivateAnimatedPreview({
  videoUrl,
  gifUrl,
  interaction,
  reducedMotion,
}: {
  videoUrl: string;
  gifUrl: string;
  interaction: PreviewInteraction;
  reducedMotion: boolean;
}): boolean {
  return Boolean(videoUrl || gifUrl) && !reducedMotion && interaction !== "touch";
}
