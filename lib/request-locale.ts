import type { Locale } from "../content/schema";

export const REQUEST_LOCALE_HEADER = "x-portfolio-locale";

export function localeFromPathname(pathname: string): Locale | null {
  const match = /^\/(fr|en)(?:\/|$)/.exec(pathname);
  return match?.[1] === "fr" ? "fr" : match?.[1] === "en" ? "en" : null;
}

export function documentLanguage(locale: string | null): Locale {
  return locale === "fr" ? "fr" : "en";
}
