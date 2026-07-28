import type { Locale, PortfolioContent } from "../../content/schema";
import { FooterLinks } from "./FooterLinks";
import { SiteHeader } from "./SiteHeader";

export function AboutView({
  locale,
  content,
  routeBase = "",
}: {
  locale: Locale;
  content: PortfolioContent;
  routeBase?: string;
}) {
  const copy = content.about[locale];

  return (
    <main>
      <SiteHeader locale={locale} content={content} routeBase={routeBase} />
      <section className="about-hero shell">
        <p className="section-label">{content.about.label}</p>
        <h1>{copy.title}</h1>
        {/* The source is client-managed JSON and may use any HTTPS host. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.about.imageUrl}
          alt={copy.imageAlt}
          loading="eager"
        />
        <p className="about-intro">{copy.intro}</p>
      </section>

      <section className="manifesto shell">
        <p className="section-label">01 / Manifesto</p>
        <blockquote>{copy.manifesto}</blockquote>
      </section>

      <section className="services shell">
        <p className="section-label">02 / {copy.practiceLabel}</p>
        <div>
          {copy.services.map((service, index) => (
            <p key={service}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {service}
            </p>
          ))}
        </div>
      </section>

      <section className="lists shell">
        <div>
          <p className="section-label">{copy.clientsLabel}</p>
          <p>
            {content.about.clients.map((client) => (
              <span key={client}>
                {client}
                <br />
              </span>
            ))}
          </p>
        </div>
        <div>
          <p className="section-label">{copy.recognitionLabel}</p>
          <p>
            {content.about.recognition.map((recognition) => (
              <span key={recognition}>
                {recognition}
                <br />
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="process shell">
        {copy.process.map((item, index) => (
          <article key={item.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="availability shell">
        <p>{copy.availability}</p>
        <a
          className="arrow-link focus-ring"
          href={`mailto:${content.site.email}?subject=Credentials%20request`}
        >
          {copy.credentials} ↗
        </a>
      </section>

      <footer className="contact-footer">
        <p>{copy.footerTitle}</p>
        <a
          className="email-link focus-ring"
          href={`mailto:${content.site.email}`}
        >
          {content.site.email.toUpperCase()}
        </a>
        <FooterLinks locale={locale} content={content} routeBase={routeBase} />
      </footer>
    </main>
  );
}
