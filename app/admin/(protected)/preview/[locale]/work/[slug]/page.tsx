import { notFound } from "next/navigation";
import { ProjectView } from "../../../../../../components/ProjectView";
import { isLocale } from "../../../../../../../lib/content/locales";
import { getDraftContent } from "../../../../../../../lib/content/repository";

export const dynamic = "force-dynamic";

export default async function AdminProjectPreview({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const content = await getDraftContent();
  const projects = content.projects.slice().sort((a, b) => a.order - b.order);
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();

  return (
    <div className="admin-preview">
      <div className="admin-preview-banner">
        Aperçu privé du brouillon — rien ici n’est encore publié
      </div>
      <ProjectView
        locale={locale}
        content={content}
        project={project}
        projects={projects}
        routeBase="/admin/preview"
      />
    </div>
  );
}
