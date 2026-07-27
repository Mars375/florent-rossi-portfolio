import type { Locale } from "../../content/schema";

export const locales = ["en", "fr"] as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizedPath(value: string, nextLocale: Locale): string {
  const url = new URL(value, "https://atelier-vif.local");
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments[0] && isLocale(segments[0])) {
    segments[0] = nextLocale;
  } else {
    segments.unshift(nextLocale);
  }

  return `/${segments.join("/")}${url.search}${url.hash}`;
}
