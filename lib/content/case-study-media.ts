import type { Project } from "../../content/schema";
import { projectPreviewSources } from "./preview";

export function caseStudyGallery(project: Project): Project["gallery"] {
  const { videoUrl, gifUrl } = projectPreviewSources(project);
  const previewUrls = new Set([videoUrl, gifUrl].filter(Boolean));

  return project.gallery.filter((media) => !previewUrls.has(media.url));
}
