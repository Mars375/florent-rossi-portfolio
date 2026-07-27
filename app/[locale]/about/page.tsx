import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/SiteHeader";
import { locales } from "../../data/portfolio.mjs";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "fr" ? "Studio & Contact" : "Studio & Contact" };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale)) notFound();
  const locale = rawLocale as "en" | "fr";
  const fr = locale === "fr";

  const services = fr
    ? ["Stratégie créative", "Direction artistique", "Univers de marque", "Campagnes", "Film & motion", "Expériences digitales"]
    : ["Creative strategy", "Art direction", "Brand worlds", "Campaigns", "Film & motion", "Digital experiences"];

  return (
    <main>
      <SiteHeader locale={locale} alternatePath={`/${fr ? "en" : "fr"}/about`} />
      <section className="about-hero shell">
        <p className="section-label">STUDIO / PARIS</p>
        <h1>
          {fr
            ? "Un studio pour les idées qui refusent de rester immobiles."
            : "A studio for ideas that refuse to sit still."}
        </h1>
        <img
          src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=88"
          alt={fr ? "Studio créatif Atelier Vif" : "Atelier Vif creative studio"}
        />
        <p className="about-intro">
          {fr
            ? "Atelier Vif est un studio indépendant qui façonne identités, campagnes et images en mouvement pour la culture, la musique et la mode."
            : "Atelier Vif is an independent art direction practice shaping identities, campaigns and moving images across culture, music and fashion."}
        </p>
      </section>

      <section className="manifesto shell">
        <p className="section-label">01 / MANIFESTO</p>
        <blockquote>
          {fr
            ? "Nous cherchons la tension juste : entre une idée claire et une image impossible à oublier."
            : "We look for the right tension: between a clear idea and an image that refuses to be forgotten."}
        </blockquote>
      </section>

      <section className="services shell">
        <p className="section-label">02 / {fr ? "PRATIQUE" : "PRACTICE"}</p>
        <div>
          {services.map((service, index) => (
            <p key={service}><span>0{index + 1}</span>{service}</p>
          ))}
        </div>
      </section>

      <section className="lists shell">
        <div>
          <p className="section-label">SELECTED CLIENTS</p>
          <p>Maison Objet<br />Éclat Magazine<br />Nordic Soundscape<br />Verso Film<br />Palais 21</p>
        </div>
        <div>
          <p className="section-label">{fr ? "RECONNAISSANCE" : "RECOGNITION"}</p>
          <p>Graphis New Talent<br />Type Directors Club<br />Creative Review<br />It’s Nice That</p>
        </div>
      </section>

      <section className="process shell">
        {[
          [fr ? "ÉCOUTER" : "LISTEN", fr ? "Comprendre le contexte, la culture et la tension centrale." : "Understand the context, culture and central tension."],
          [fr ? "FAÇONNER" : "SHAPE", fr ? "Construire un langage distinct, cohérent et flexible." : "Build a distinct, coherent and flexible language."],
          [fr ? "METTRE EN MOUVEMENT" : "MOVE", fr ? "Déployer l’idée dans chaque image, espace et interaction." : "Carry the idea through every image, space and interaction."],
        ].map(([title, text], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="availability shell">
        <p>{fr ? "DISPONIBLE POUR Q3 / Q4 2026" : "CURRENTLY BOOKING FOR Q3 / Q4 2026"}</p>
        <a
          className="arrow-link focus-ring"
          href="mailto:hello@ateliervif.com?subject=Credentials%20request"
        >
          {fr ? "DEMANDER LES RÉFÉRENCES" : "REQUEST CREDENTIALS"} ↗
        </a>
      </section>

      <footer className="contact-footer">
        <p>{fr ? "UN PROJET EN MOUVEMENT ?" : "HAVE A PROJECT IN MOTION?"}</p>
        <a className="email-link focus-ring" href="mailto:hello@ateliervif.com">
          HELLO@ATELIERVIF.COM
        </a>
        <div><span>INSTAGRAM</span><span>VIMEO</span><span>PARIS / WORLDWIDE</span></div>
      </footer>
    </main>
  );
}
