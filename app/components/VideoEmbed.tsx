import type { Locale, Project } from "../../content/schema";
import type { LegalLocaleContent } from "../../content/legal";
import { parseVideoSource } from "../../lib/content/video";
import { ExternalVideoConsent } from "./ExternalVideoConsent";

export function VideoEmbed({
  project,
  locale,
  consentCopy,
}: {
  project: Project;
  locale: Locale;
  consentCopy: Pick<LegalLocaleContent, "loadVideo" | "externalVideoNotice">;
}) {
  let source: ReturnType<typeof parseVideoSource>;
  try {
    source = parseVideoSource(
      project.fullVideo.url,
      project.fullVideo.provider,
    );
  } catch {
    return (
      <div className="full-video video-unavailable" role="status">
        {locale === "fr"
          ? "Cette vidéo est momentanément indisponible."
          : "This video is temporarily unavailable."}
      </div>
    );
  }
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
    <ExternalVideoConsent
      embedUrl={source.src}
      notice={consentCopy.externalVideoNotice}
      buttonLabel={consentCopy.loadVideo}
      provider={project.fullVideo.provider === "vimeo" ? "Vimeo" : "YouTube"}
      posterUrl={project.posterUrl}
      title={title}
    />
  );
}
