import Link from "next/link";
import type { Locale, PortfolioContent } from "../../content/schema";
import { LanguageSwitcher } from "./LanguageSwitcher";

type SiteHeaderProps = {
  locale: Locale;
  content: PortfolioContent;
};

export function SiteHeader({ locale, content }: SiteHeaderProps) {
  const labels = content.navigation[locale];

  return (
    <header className="site-header">
      <Link className="wordmark focus-ring" href={`/${locale}`}>
        {content.site.name}
      </Link>
      <nav aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}>
        <Link className="nav-link focus-ring" href={`/${locale}#work`}>
          {labels.work}
        </Link>
        <Link className="nav-link focus-ring" href={`/${locale}/about`}>
          {labels.about}
        </Link>
        <a className="nav-link focus-ring" href={`mailto:${content.site.email}`}>
          {labels.contact}
        </a>
      </nav>
      <LanguageSwitcher locale={locale} />
    </header>
  );
}
