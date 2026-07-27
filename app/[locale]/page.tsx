import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioHome } from "../components/PortfolioHome";
import { isLocale } from "../../lib/content/locales";
import { getPublishedContent } from "../../lib/content/repository";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";

  return {
    title: fr ? "Direction artistique" : "Art Direction",
    description: fr
      ? "Direction artistique indépendante pour la culture, la musique et la mode."
      : "Independent art direction for culture, music and fashion.",
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale;
  const content = await getPublishedContent();
  return <PortfolioHome locale={locale} content={content} />;
}
