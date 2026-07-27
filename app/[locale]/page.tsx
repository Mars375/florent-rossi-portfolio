import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard } from "../components/ProjectCard";
import { SiteHeader } from "../components/SiteHeader";
import {
  getDictionary,
  locales,
  projects,
} from "../data/portfolio.mjs";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "fr" ? "Direction artistique" : "Art Direction",
    description:
      locale === "fr"
        ? "Direction artistique indépendante pour la culture, la musique et la mode."
        : "Independent art direction for culture, music and fashion.",
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale)) notFound();
  const locale = rawLocale as "en" | "fr";
  const copy = getDictionary(locale);
  const profileLink = locale === "fr" ? "Découvrir le studio" : "Discover the studio";

  return (
    <main>
      <SiteHeader locale={locale} alternatePath={`/${locale === "en" ? "fr" : "en"}`} />

      <section className="hero shell">
        <div className="hero-kicker">{copy.selectedWork}</div>
        <h1>
          <span>{copy.hero.lineOne}</span>
          <span>{copy.hero.lineTwo}</span>
        </h1>
        <p>{copy.hero.intro}</p>
        <a className="scroll-cue focus-ring" href="#work">
          ↓ {locale === "fr" ? "Voir les projets" : "View work"}
        </a>
      </section>

      <section className="work-grid shell" id="work" aria-label={copy.nav.work}>
        {projects.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
            locale={locale}
            playingLabel={copy.playing}
            viewLabel={copy.viewProject}
          />
        ))}
      </section>

      <div className="capability-strip" aria-label="Capabilities">
        <div>{copy.capabilities} / {copy.capabilities}</div>
      </div>

      <section className="profile-teaser shell">
        <p className="section-label">Studio / 02</p>
        <p className="profile-statement">{copy.profile}</p>
        <Link className="arrow-link focus-ring" href={`/${locale}/about`}>
          {profileLink} ↗
        </Link>
      </section>

      <footer className="giant-footer">
        <p>{copy.footer}</p>
        <a className="email-link focus-ring" href="mailto:hello@ateliervif.com">
          HELLO@ATELIERVIF.COM
        </a>
        <div className="footer-meta">
          <span>PARIS / WORLDWIDE</span>
          <span>INSTAGRAM / VIMEO</span>
          <span>© 2026 ATELIER VIF</span>
        </div>
      </footer>
    </main>
  );
}
