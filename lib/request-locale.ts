import type { Locale } from "../content/schema";

export const REQUEST_LOCALE_HEADER = "x-portfolio-locale";

export function localeFromPathname(pathname: string): Locale | null {
  const match = /^(?:\/admin\/preview)?\/(fr|en)(?:\/|$)/.exec(pathname);
  if (match?.[1] === "fr") return "fr";
  if (match?.[1] === "en") return "en";

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "fr";
  return null;
}

export function documentLanguage(locale: string | null): Locale {
  return locale === "fr" ? "fr" : "en";
}
