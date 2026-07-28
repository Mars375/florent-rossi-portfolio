import Link from "next/link";
import type { Locale, PortfolioContent } from "../../content/schema";

export function FooterLinks({
  locale,
  content,
  routeBase = "",
  compact = false,
}: {
  locale: Locale;
  content: PortfolioContent;
  routeBase?: string;
  compact?: boolean;
}) {
  const copy = content.legal[locale];

  return (
    <div className={`utility-footer ${compact ? "is-compact" : ""}`}>
      <span>{content.site.location[locale]}</span>
      <nav aria-label={locale === "fr" ? "Réseaux sociaux" : "Social media"}>
        {content.site.socials.map((social) => (
          <a
            className="nav-link focus-ring"
            href={social.url}
            key={`${social.label}-${social.url}`}
            target="_blank"
            rel="noreferrer"
          >
            {social.label}
          </a>
        ))}
      </nav>
      <nav
        aria-label={
          locale === "fr" ? "Informations légales" : "Legal information"
        }
      >
        <Link className="nav-link focus-ring" href={`${routeBase}/${locale}/legal`}>
          {copy.footerLegal}
        </Link>
        <Link
          className="nav-link focus-ring"
          href={`${routeBase}/${locale}/privacy`}
        >
          {copy.footerPrivacy}
        </Link>
      </nav>
      <span>{content.site.copyright}</span>
    </div>
  );
}
