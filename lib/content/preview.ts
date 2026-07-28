import type { Project } from "../../content/schema";

export type PreviewEnvironment = {
  gifUrl: string;
  canHover: boolean;
  finePointer: boolean;
  reducedMotion: boolean;
};

export function projectPreviewGifUrl(project: Project): string {
  if (project.preview.fallbackGifUrl) {
    return project.preview.fallbackGifUrl;
  }

  return project.preview.type === "gif" ? project.preview.url : "";
}

export function canUseAnimatedPreview({
  gifUrl,
  canHover,
  finePointer,
  reducedMotion,
}: PreviewEnvironment): boolean {
  return Boolean(gifUrl) && canHover && finePointer && !reducedMotion;
}
