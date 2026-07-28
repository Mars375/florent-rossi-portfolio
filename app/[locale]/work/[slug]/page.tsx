import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectView } from "../../../components/ProjectView";
import { isLocale } from "../../../../lib/content/locales";
import { getPublishedContent } from "../../../../lib/content/repository";
import { localizedAlternates, localizedUrl } from "../../../../lib/site-url";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const content = await getPublishedContent();
  const project = content.projects.find((item) => item.slug === slug);

  return {
    title: project?.title[locale] ?? "Project",
    description: project?.summary[locale],
    alternates: localizedAlternates(locale, `/work/${project?.slug ?? slug}`),
    openGraph: {
      url: localizedUrl(locale, `/work/${project?.slug ?? slug}`),
    },
  };
}

export default async function WorkPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale;
  const content = await getPublishedContent();
  const projects = content.projects
    .filter((item) => item.status === "published")
    .sort((a, b) => a.order - b.order);
  const projectIndex = projects.findIndex((item) => item.slug === slug);
  const project = projects[projectIndex];
  if (!project) notFound();

  return (
    <ProjectView
      locale={locale}
      content={content}
      project={project}
      projects={projects}
    />
  );
}
