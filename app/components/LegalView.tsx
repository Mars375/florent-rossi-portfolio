import type { Locale, PortfolioContent } from "../../content/schema";
import { FooterLinks } from "./FooterLinks";
import { SiteHeader } from "./SiteHeader";

type LegalSection =
  | {
      id:
        | "publisher"
        | "intellectual-property"
        | "external-links"
        | "controller"
        | "data"
        | "purposes"
        | "providers"
        | "retention"
        | "storage"
        | "videos";
      kind: "text";
      title: string;
      text: string;
    }
  | {
      id: "contact";
      kind: "email";
      title: string;
      text: string;
      href: string;
    }
  | {
      id: "host";
      kind: "host";
      title: string;
      text: string;
      href: string;
    }
  | {
      id: "rights";
      kind: "cnil";
      title: string;
      text: string;
      href: string;
    };

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
  const sections: LegalSection[] =
    kind === "legal"
      ? [
          {
            id: "publisher",
            kind: "text",
            title: copy.publisherLabel,
            text: copy.publisherText,
          },
          {
            id: "contact",
            kind: "email",
            title: copy.contactLabel,
            text: content.site.email,
            href: `mailto:${content.site.email}`,
          },
          {
            id: "host",
            kind: "host",
            title: copy.hostLabel,
            text: `${content.legal.host.name}\n${content.legal.host.address}`,
            href: content.legal.host.url,
          },
          {
            id: "intellectual-property",
            kind: "text",
            title: copy.intellectualPropertyLabel,
            text: copy.intellectualPropertyText,
          },
          {
            id: "external-links",
            kind: "text",
            title: copy.externalLinksLabel,
            text: copy.externalLinksText,
          },
        ]
      : [
          {
            id: "controller",
            kind: "text",
            title: copy.controllerLabel,
            text: copy.controllerText,
          },
          {
            id: "data",
            kind: "text",
            title: copy.dataLabel,
            text: copy.dataText,
          },
          {
            id: "purposes",
            kind: "text",
            title: copy.purposesLabel,
            text: copy.purposesText,
          },
          {
            id: "providers",
            kind: "text",
            title: copy.providersLabel,
            text: copy.providersText,
          },
          {
            id: "retention",
            kind: "text",
            title: copy.retentionLabel,
            text: copy.retentionText,
          },
          {
            id: "rights",
            kind: "cnil",
            title: copy.rightsLabel,
            text: copy.rightsText,
            href: "https://www.cnil.fr/",
          },
          {
            id: "storage",
            kind: "text",
            title: copy.storageLabel,
            text: copy.storageText,
          },
          {
            id: "videos",
            kind: "text",
            title: copy.videosLabel,
            text: copy.videosText,
          },
        ];

  return (
    <>
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
          {sections.map((section, index) => (
            <section key={section.id}>
              <p className="section-label">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2>{section.title}</h2>
              {section.kind === "email" ? (
                <a href={section.href}>{section.text}</a>
              ) : (
                <p>{section.text}</p>
              )}
              {section.kind === "host" || section.kind === "cnil" ? (
                <a href={section.href}>{section.href}</a>
              ) : null}
            </section>
          ))}
        </div>
        <p className="legal-updated">
          {copy.updatedLabel}: {content.legal.updatedAt}
        </p>
      </article>
      </main>
      <footer>
        <FooterLinks
          locale={locale}
          content={content}
          routeBase={routeBase}
          compact
        />
      </footer>
    </>
  );
}
