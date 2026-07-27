import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutView } from "../../components/AboutView";
import { isLocale } from "../../../lib/content/locales";
import { getPublishedContent } from "../../../lib/content/repository";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Studio & Contact" };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale;
  const content = await getPublishedContent();
  return <AboutView locale={locale} content={content} />;
}
