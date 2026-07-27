import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import {
  getProjectBySlug,
  locales,
  projects,
} from "../../../data/portfolio.mjs";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProjectBySlug(slug);
  const safeLocale = locales.includes(locale) ? (locale as "en" | "fr") : "en";
  return { title: project?.title[safeLocale] ?? "Project" };
}

export default async function WorkPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const project = getProjectBySlug(slug);
  if (!locales.includes(rawLocale) || !project) notFound();
  const locale = rawLocale as "en" | "fr";
  const fr = locale === "fr";
  const alternate = `/${fr ? "en" : "fr"}/work/${slug}`;
  const next = projects[(projects.findIndex((item) => item.slug === slug) + 1) % projects.length];

  return (
    <main>
      <SiteHeader locale={locale} alternatePath={alternate} />
      <article className="case-study">
        <header className="case-hero shell">
          <p className="section-label">01 / {fr ? "PROJET CHOISI" : "SELECTED WORK"}</p>
          <h1>{project.title[locale]}</h1>
          <div className="case-meta">
            <p>
              {fr
                ? "Identité, campagne et film pour un festival après le coucher du soleil."
                : "Identity, campaign & film for a festival after sunset."}
            </p>
            <span>{project.year}</span>
            <span>{project.discipline[locale]}</span>
          </div>
        </header>

        <a
          className="case-film focus-ring"
          href={project.fullVideoUrl}
          target="_blank"
          rel="noreferrer"
        >
          <img src={project.poster} alt={`${project.title[locale]} campaign still`} />
          <span className="film-play">▶ {fr ? "VOIR LE FILM" : "PLAY FULL FILM"}</span>
        </a>

        <section className="story-section shell story-split">
          <p className="section-label">01 / {fr ? "LE BRIEF" : "THE BRIEF"}</p>
          <p className="story-lead">
            {fr
              ? "Créer une identité capable de traduire l’énergie d’une nuit entière, de l’affiche au dernier plan du film."
              : "Build an identity that could carry the energy of an entire night—from the first poster to the film’s final frame."}
          </p>
        </section>

        <section className="idea-section">
          <p className="section-label">02 / {fr ? "L’IDÉE" : "THE IDEA"}</p>
          <h2>{fr ? "La nuit devient une fréquence." : "Night becomes a frequency."}</h2>
        </section>

        <section className="visual-sequence shell">
          <figure className="visual-large">
            <img
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=88"
              alt={fr ? "Scène du festival Afterdark" : "Afterdark festival scene"}
            />
            <figcaption>{fr ? "Le système en mouvement / Film 01" : "The system in motion / Film 01"}</figcaption>
          </figure>
          <figure>
            <img
              src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=88"
              alt={fr ? "Lumières et foule" : "Lights and crowd"}
            />
            <figcaption>{fr ? "Direction lumière" : "Light direction"}</figcaption>
          </figure>
          <figure>
            <img
              src="https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1200&q=88"
              alt={fr ? "Performance musicale" : "Music performance"}
            />
            <figcaption>{fr ? "Cadre social vertical" : "Vertical social crop"}</figcaption>
          </figure>
        </section>

        <section className="story-section shell story-split">
          <p className="section-label">03 / {fr ? "LE SYSTÈME" : "THE SYSTEM"}</p>
          <p className="story-lead">
            {fr
              ? "Une typographie condensée, un rythme stroboscopique et un spectre acide composent un langage flexible pour l’écran, l’espace et l’imprimé."
              : "Condensed type, a strobing rhythm and an acid spectrum form a flexible language across screen, space and print."}
          </p>
        </section>

        <section className="credits shell">
          <div>
            <p className="section-label">04 / {fr ? "IMPACT" : "OUTCOME"}</p>
            <p className="story-lead">
              {fr
                ? "Une campagne cohérente dans douze villes et un film devenu la pièce centrale du lancement."
                : "A coherent campaign across twelve cities, with the film becoming the launch’s central piece."}
            </p>
          </div>
          <dl>
            <div><dt>Creative Direction</dt><dd>Atelier Vif</dd></div>
            <div><dt>Film</dt><dd>Studio Mirage</dd></div>
            <div><dt>Photography</dt><dd>Ana Sol</dd></div>
            <div><dt>Type</dt><dd>Custom</dd></div>
            <div><dt>Sound</dt><dd>Nox</dd></div>
          </dl>
        </section>

        <nav className="project-nav shell" aria-label={fr ? "Navigation des projets" : "Project navigation"}>
          <Link href={`/${locale}`}>
            ← {fr ? "Retour aux projets" : "Back to all work"}
          </Link>
          <Link href={`/${locale}/work/${next.slug}`}>
            {fr ? "Projet suivant" : "Next project"}: {next.title[locale]} →
          </Link>
        </nav>
      </article>
    </main>
  );
}
