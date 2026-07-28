import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalView } from "../../components/LegalView";
import { isLocale } from "../../../lib/content/locales";
import { getPublishedContent } from "../../../lib/content/repository";
import { localizedAlternates, localizedUrl } from "../../../lib/site-url";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolved = locale === "fr" ? "fr" : "en";
  return {
    title: resolved === "fr" ? "Mentions légales" : "Legal notice",
    alternates: localizedAlternates(resolved, "/legal"),
    openGraph: { url: localizedUrl(resolved, "/legal") },
  };
}

export default async function LegalPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <LegalView
      locale={locale}
      content={await getPublishedContent()}
      kind="legal"
    />
  );
}
