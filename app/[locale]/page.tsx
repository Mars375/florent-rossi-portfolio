import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard } from "../components/ProjectCard";
import { SiteHeader } from "../components/SiteHeader";
import { isLocale } from "../../lib/content/locales";
import { getPublishedContent } from "../../lib/content/repository";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";

  return {
    title: fr ? "Direction artistique" : "Art Direction",
    description: fr
      ? "Direction artistique indépendante pour la culture, la musique et la mode."
      : "Independent art direction for culture, music and fashion.",
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale;
  const content = await getPublishedContent();
  const copy = content.home[locale];
  const projects = content.projects
    .filter((project) => project.status === "published")
    .sort((a, b) => a.order - b.order);

  return (
    <main>
      <SiteHeader locale={locale} content={content} />

      <section className="hero shell">
        <div className="hero-kicker">{copy.selectedWork}</div>
        <h1>
          <span>{copy.heroLineOne}</span>
          <span>{copy.heroLineTwo}</span>
        </h1>
        <p>{copy.intro}</p>
        <a className="scroll-cue focus-ring" href="#work">
          ↓ {copy.scrollCue}
        </a>
      </section>

      <section
        className="work-grid shell"
        id="work"
        aria-label={content.navigation[locale].work}
      >
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            locale={locale}
            playingLabel={copy.playing}
            viewLabel={copy.viewProject}
          />
        ))}
      </section>

      <div className="capability-strip" aria-label={copy.capabilities}>
        <div>
          {copy.capabilities} / {copy.capabilities}
        </div>
      </div>

      <section className="profile-teaser shell">
        <p className="section-label">{content.about.label} / 02</p>
        <p className="profile-statement">{copy.profile}</p>
        <Link className="arrow-link focus-ring" href={`/${locale}/about`}>
          {copy.profileLink} ↗
        </Link>
      </section>

      <footer className="giant-footer">
        <p>{copy.footerTitle}</p>
        <a
          className="email-link focus-ring"
          href={`mailto:${content.site.email}`}
        >
          {content.site.email.toUpperCase()}
        </a>
        <div className="footer-meta">
          <span>{content.site.location[locale].toUpperCase()}</span>
          <span>
            {content.site.socials.map((social) => social.label).join(" / ")}
          </span>
          <span>{content.site.copyright.toUpperCase()}</span>
        </div>
      </footer>
    </main>
  );
}
