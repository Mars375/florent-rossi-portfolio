import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioHome } from "../components/PortfolioHome";
import { isLocale } from "../../lib/content/locales";
import { getPublishedContent } from "../../lib/content/repository";
import { localizedAlternates } from "../../lib/site-url";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";

  return {
    title: fr ? "Direction artistique" : "Art Direction",
    description: fr
      ? "Florent Rossi, directeur artistique basé à Paris, recherche un poste permanent en agence ou chez une marque."
      : "Florent Rossi is a Paris-based art director looking for a permanent position in an agency or brand.",
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
