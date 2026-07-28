import type { Metadata } from "next";
import type { Locale } from "../content/schema";

export const PRODUCTION_SITE_URL = "https://florentrossi.fr";

export function getSiteUrl(
  value = process.env.NEXT_PUBLIC_SITE_URL,
): URL {
  try {
    const url = new URL(value || PRODUCTION_SITE_URL);
    const safeProtocol = url.protocol === "https:" || url.protocol === "http:";
    const cleanOrigin =
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash;

    return safeProtocol && cleanOrigin
      ? url
      : new URL(PRODUCTION_SITE_URL);
  } catch {
    return new URL(PRODUCTION_SITE_URL);
  }
}

export function localizedAlternates(
  locale: Locale,
  path = "",
  value?: string,
): Metadata["alternates"] {
  const base = getSiteUrl(value);
  const suffix = path === "" || path.startsWith("/") ? path : `/${path}`;

  return {
    canonical: new URL(`/${locale}${suffix}`, base),
    languages: {
      fr: new URL(`/fr${suffix}`, base),
      en: new URL(`/en${suffix}`, base),
    },
  };
}
