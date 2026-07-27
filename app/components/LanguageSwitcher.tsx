"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import type { Locale } from "../../content/schema";
import { localizedPath, locales } from "../../lib/content/locales";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (
    event: MouseEvent<HTMLAnchorElement>,
    nextLocale: Locale,
  ) => {
    event.preventDefault();
    router.push(
      localizedPath(
        `${pathname}${window.location.search}${window.location.hash}`,
        nextLocale,
      ),
    );
  };

  return (
    <div
      className="locale-switch"
      aria-label={locale === "fr" ? "Choisir la langue" : "Choose language"}
    >
      {locales.map((nextLocale, index) => (
        <span key={nextLocale}>
          {index > 0 ? <span aria-hidden="true"> / </span> : null}
          <Link
            className="focus-ring"
            aria-current={locale === nextLocale ? "page" : undefined}
            href={localizedPath(pathname, nextLocale)}
            hrefLang={nextLocale}
            lang={nextLocale}
            onClick={(event) => switchLocale(event, nextLocale)}
          >
            {nextLocale.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
