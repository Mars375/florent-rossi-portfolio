import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutView } from "../../components/AboutView";
import { isLocale } from "../../../lib/content/locales";
import { getPublishedContent } from "../../../lib/content/repository";
import { localizedAlternates, localizedUrl } from "../../../lib/site-url";
import { publicPageMetadata } from "../../../lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = locale === "fr" ? "fr" : "en";
  return {
    ...publicPageMetadata({
      pageTitle: resolvedLocale === "fr" ? "À propos" : "About",
      url: localizedUrl(resolvedLocale, "/about"),
    }),
    alternates: localizedAlternates(resolvedLocale, "/about"),
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale;
  const content = await getPublishedContent();
  return <AboutView locale={locale} content={content} />;
}
