import type { Metadata } from "next";
import type { Locale } from "../content/schema";

export const PRODUCTION_SITE_URL = "https://florentrossi.com";

export function getCanonicalSiteUrl(): URL {
  return new URL(PRODUCTION_SITE_URL);
}

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

export function adminAuthCallbackUrl(
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  environment: string | undefined = process.env.NODE_ENV,
): string {
  const base =
    environment === "development"
      ? getSiteUrl(configuredSiteUrl)
      : getCanonicalSiteUrl();

  return new URL("/auth/confirm?next=/admin", base).toString();
}

export function localizedAlternates(
  locale: Locale,
  path = "",
): Metadata["alternates"] {
  const base = getCanonicalSiteUrl();
  const suffix = path === "" || path.startsWith("/") ? path : `/${path}`;

  return {
    canonical: new URL(`/${locale}${suffix}`, base),
    languages: {
      fr: new URL(`/fr${suffix}`, base),
      en: new URL(`/en${suffix}`, base),
    },
  };
}
