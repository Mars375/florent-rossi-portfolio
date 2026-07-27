import Link from "next/link";

type SiteHeaderProps = {
  locale: "en" | "fr";
  alternatePath: string;
};

export function SiteHeader({ locale, alternatePath }: SiteHeaderProps) {
  const labels =
    locale === "fr"
      ? { work: "Projets", studio: "Studio", contact: "Contact" }
      : { work: "Work", studio: "Studio", contact: "Contact" };

  return (
    <header className="site-header">
      <Link className="wordmark focus-ring" href={`/${locale}`}>
        Atelier Vif
      </Link>
      <nav aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}>
        <Link className="nav-link focus-ring" href={`/${locale}#work`}>
          {labels.work}
        </Link>
        <Link className="nav-link focus-ring" href={`/${locale}/about`}>
          {labels.studio}
        </Link>
        <a className="nav-link focus-ring" href="mailto:hello@ateliervif.com">
          {labels.contact}
        </a>
      </nav>
      <div className="locale-switch" aria-label="Language">
        <span aria-current={locale === "en" ? "page" : undefined}>EN</span>
        <span aria-hidden="true">/</span>
        <Link
          className="focus-ring"
          aria-current={locale === "fr" ? "page" : undefined}
          href={alternatePath}
        >
          FR
        </Link>
      </div>
    </header>
  );
}
