import Link from "next/link";
import type { Locale, PortfolioContent } from "../../content/schema";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

type SiteHeaderProps = {
  locale: Locale;
  content: PortfolioContent;
  routeBase?: string;
};

export function SiteHeader({
  locale,
  content,
  routeBase = "",
}: SiteHeaderProps) {
  const labels = content.navigation[locale];
  const homeHref = `${routeBase}/${locale}`;

  return (
    <header className="site-header">
      <Link className="wordmark focus-ring" href={homeHref}>
        {content.site.name}
      </Link>
      <nav aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}>
        <Link className="nav-link focus-ring" href={`${homeHref}#work`}>
          {labels.work}
        </Link>
        <Link className="nav-link focus-ring" href={`${homeHref}/about`}>
          {labels.about}
        </Link>
        <a className="nav-link focus-ring" href={`mailto:${content.site.email}`}>
          {labels.contact}
        </a>
      </nav>
      <div className="header-actions">
        <LanguageSwitcher locale={locale} />
        <ThemeToggle locale={locale} />
      </div>
    </header>
  );
}
