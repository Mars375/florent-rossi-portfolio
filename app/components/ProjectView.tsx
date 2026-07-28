import Link from "next/link";
import type {
  Locale,
  PortfolioContent,
  Project,
} from "../../content/schema";
import { FooterLinks } from "./FooterLinks";
import { SiteHeader } from "./SiteHeader";
import { VideoEmbed } from "./VideoEmbed";

export function ProjectView({
  locale,
  content,
  project,
  projects,
  routeBase = "",
}: {
  locale: Locale;
  content: PortfolioContent;
  project: Project;
  projects: Project[];
  routeBase?: string;
}) {
  const projectIndex = projects.findIndex((item) => item.id === project.id);
  const next = projects[(projectIndex + 1) % projects.length];
  const labels = content.projectPage[locale];
  const story = project.story[locale];
  const number = String(project.order).padStart(2, "0");
  const homeHref = `${routeBase}/${locale}`;

  return (
    <main>
      <SiteHeader locale={locale} content={content} routeBase={routeBase} />
      <article className="case-study">
        <header className="case-hero shell">
          <p className="section-label">
            {number} / {labels.selectedWork}
          </p>
          <h1>{project.title[locale]}</h1>
          <div className="case-meta">
            <p>{project.summary[locale]}</p>
            <span>{project.year}</span>
            <span>{project.discipline[locale]}</span>
          </div>
        </header>

        <section className="case-film" id="film">
          <VideoEmbed
            project={project}
            locale={locale}
            consentCopy={content.legal[locale]}
          />
          {project.fullVideo.provider === "mp4" ? (
            <span className="film-play">▶ {labels.playFilm}</span>
          ) : null}
        </section>

        <section className="story-section shell story-split">
          <p className="section-label">01 / {labels.brief}</p>
          <p className="story-lead">{story.brief}</p>
        </section>

        <section className="idea-section">
          <p className="section-label">02 / {labels.idea}</p>
          <h2>{story.idea}</h2>
        </section>

        {project.gallery.length > 0 ? (
          <section className="visual-sequence shell">
            {project.gallery.map((media, index) => (
              <figure
                className={index === 0 ? "visual-large" : undefined}
                key={`${media.url}-${index}`}
              >
                {media.type === "video" ? (
                  <video
                    src={media.url}
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={media.url}
                    alt={media.alt[locale]}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                )}
                <figcaption>{media.caption[locale]}</figcaption>
              </figure>
            ))}
          </section>
        ) : null}

        <section className="story-section shell story-split">
          <p className="section-label">03 / {labels.system}</p>
          <p className="story-lead">{story.system}</p>
        </section>

        <section className="credits shell">
          <div>
            <p className="section-label">04 / {labels.outcome}</p>
            <p className="story-lead">{story.outcome}</p>
          </div>
          <dl>
            {project.credits.map((credit) => (
              <div key={`${credit.role}-${credit.name}`}>
                <dt>{credit.role}</dt>
                <dd>{credit.name}</dd>
              </div>
            ))}
          </dl>
        </section>

        <nav
          className="project-nav shell"
          aria-label={
            locale === "fr" ? "Navigation des projets" : "Project navigation"
          }
        >
          <Link href={homeHref}>← {labels.back}</Link>
          <Link href={`${homeHref}/work/${next.slug}`}>
            {labels.next}: {next.title[locale]} →
          </Link>
        </nav>
        <FooterLinks
          locale={locale}
          content={content}
          routeBase={routeBase}
          compact
        />
      </article>
    </main>
  );
}
