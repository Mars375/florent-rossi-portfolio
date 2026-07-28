import type { Locale, PortfolioContent } from "../../content/schema";
import { FooterLinks } from "./FooterLinks";
import { SiteHeader } from "./SiteHeader";

export function LegalView({
  locale,
  content,
  kind,
  routeBase = "",
}: {
  locale: Locale;
  content: PortfolioContent;
  kind: "legal" | "privacy";
  routeBase?: string;
}) {
  const copy = content.legal[locale];
  const sections =
    kind === "legal"
      ? [
          [copy.publisherLabel, copy.publisherText],
          [copy.contactLabel, content.site.email],
          [
            copy.hostLabel,
            `${content.legal.host.name}\n${content.legal.host.address}`,
          ],
          [copy.intellectualPropertyLabel, copy.intellectualPropertyText],
          [copy.externalLinksLabel, copy.externalLinksText],
        ]
      : [
          [copy.controllerLabel, copy.controllerText],
          [copy.dataLabel, copy.dataText],
          [copy.purposesLabel, copy.purposesText],
          [copy.providersLabel, copy.providersText],
          [copy.retentionLabel, copy.retentionText],
          [copy.rightsLabel, copy.rightsText],
          [copy.storageLabel, copy.storageText],
          [copy.videosLabel, copy.videosText],
        ];

  return (
    <main>
      <SiteHeader locale={locale} content={content} routeBase={routeBase} />
      <article className="legal-page shell">
        <header>
          <p className="section-label">
            {kind === "legal" ? "01" : "02"} / Florent Rossi
          </p>
          <h1>{kind === "legal" ? copy.legalTitle : copy.privacyTitle}</h1>
          <p>{kind === "legal" ? copy.legalIntro : copy.privacyIntro}</p>
        </header>
        <div className="legal-sections">
          {sections.map(([title, text], index) => (
            <section key={title}>
              <p className="section-label">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2>{title}</h2>
              {title === copy.contactLabel ? (
                <a href={`mailto:${content.site.email}`}>{text}</a>
              ) : (
                <p>{text}</p>
              )}
              {title === copy.hostLabel ? (
                <a href={content.legal.host.url}>{content.legal.host.url}</a>
              ) : null}
              {title === copy.rightsLabel ? (
                <a href="https://www.cnil.fr/">https://www.cnil.fr/</a>
              ) : null}
            </section>
          ))}
        </div>
        <p className="legal-updated">
          {copy.updatedLabel}: {content.legal.updatedAt}
        </p>
      </article>
      <FooterLinks
        locale={locale}
        content={content}
        routeBase={routeBase}
        compact
      />
    </main>
  );
}
