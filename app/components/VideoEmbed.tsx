import type { Locale, Project } from "../../content/schema";
import { parseVideoSource } from "../../lib/content/video";

export function VideoEmbed({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  const source = parseVideoSource(
    project.fullVideo.url,
    project.fullVideo.provider,
  );
  const title = `${project.title[locale]} — ${project.discipline[locale]}`;

  if (source.kind === "direct") {
    return (
      <video
        className="full-video"
        controls
        playsInline
        preload="metadata"
        poster={project.posterUrl}
        src={source.src}
      >
        {locale === "fr"
          ? "Votre navigateur ne peut pas lire cette vidéo."
          : "Your browser cannot play this video."}
      </video>
    );
  }

  return (
    <iframe
      className="full-video"
      src={source.src}
      title={title}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
