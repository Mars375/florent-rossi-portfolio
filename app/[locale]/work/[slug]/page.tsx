import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { VideoEmbed } from "../../../components/VideoEmbed";
import { isLocale } from "../../../../lib/content/locales";
import { getPublishedContent } from "../../../../lib/content/repository";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const content = await getPublishedContent();
  const project = content.projects.find((item) => item.slug === slug);

  return {
    title: project?.title[locale] ?? "Project",
    description: project?.summary[locale],
  };
}

export default async function WorkPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale;
  const content = await getPublishedContent();
  const projects = content.projects
    .filter((item) => item.status === "published")
    .sort((a, b) => a.order - b.order);
  const projectIndex = projects.findIndex((item) => item.slug === slug);
  const project = projects[projectIndex];
  if (!project) notFound();

  const next = projects[(projectIndex + 1) % projects.length];
  const labels = content.projectPage[locale];
  const story = project.story[locale];
  const number = String(project.order).padStart(2, "0");

  return (
    <main>
      <SiteHeader locale={locale} content={content} />
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
          <VideoEmbed project={project} locale={locale} />
          <span className="film-play">▶ {labels.playFilm}</span>
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
            locale === "fr"
              ? "Navigation des projets"
              : "Project navigation"
          }
        >
          <Link href={`/${locale}`}>← {labels.back}</Link>
          <Link href={`/${locale}/work/${next.slug}`}>
            {labels.next}: {next.title[locale]} →
          </Link>
        </nav>
      </article>
    </main>
  );
}
