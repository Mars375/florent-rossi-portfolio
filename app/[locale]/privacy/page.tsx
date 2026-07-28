import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalView } from "../../components/LegalView";
import { isLocale } from "../../../lib/content/locales";
import { getPublishedContent } from "../../../lib/content/repository";
import { localizedAlternates, localizedUrl } from "../../../lib/site-url";
import { publicPageMetadata } from "../../../lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolved = locale === "fr" ? "fr" : "en";
  return {
    ...publicPageMetadata({
      pageTitle: resolved === "fr" ? "Confidentialité" : "Privacy",
      url: localizedUrl(resolved, "/privacy"),
    }),
    alternates: localizedAlternates(resolved, "/privacy"),
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <LegalView
      locale={locale}
      content={await getPublishedContent()}
      kind="privacy"
    />
  );
}
