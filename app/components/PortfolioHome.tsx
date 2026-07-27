import Link from "next/link";
import type { Locale, PortfolioContent } from "../../content/schema";
import { ProjectCard } from "./ProjectCard";
import { SiteHeader } from "./SiteHeader";

export function PortfolioHome({
  locale,
  content,
  routeBase = "",
}: {
  locale: Locale;
  content: PortfolioContent;
  routeBase?: string;
}) {
  const copy = content.home[locale];
  const projects = content.projects
    .filter((project) => project.status === "published")
    .sort((a, b) => a.order - b.order);

  return (
    <main>
      <SiteHeader locale={locale} content={content} routeBase={routeBase} />
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
            routeBase={routeBase}
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
        <Link
          className="arrow-link focus-ring"
          href={`${routeBase}/${locale}/about`}
        >
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
