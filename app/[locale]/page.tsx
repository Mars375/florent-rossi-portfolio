import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioHome } from "../components/PortfolioHome";
import { isLocale } from "../../lib/content/locales";
import { getPublishedContent } from "../../lib/content/repository";
import { localizedAlternates, localizedUrl } from "../../lib/site-url";
import { publicPageMetadata } from "../../lib/page-metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";

  const pageTitle = fr ? "Direction artistique" : "Art Direction";
  const pageDescription = fr
      ? "Florent Rossi, directeur artistique basé à Paris, recherche un poste permanent en agence ou chez une marque."
      : "Florent Rossi is a Paris-based art director looking for a permanent position in an agency or brand.";

  return {
    ...publicPageMetadata({
      pageTitle,
      pageDescription,
      url: localizedUrl(fr ? "fr" : "en"),
    }),
    alternates: localizedAlternates(fr ? "fr" : "en"),
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale;
  const content = await getPublishedContent();
  return <PortfolioHome locale={locale} content={content} />;
}
