import { notFound } from "next/navigation";
import { AboutView } from "../../../../../components/AboutView";
import { isLocale } from "../../../../../../lib/content/locales";
import { getDraftContent } from "../../../../../../lib/content/repository";

export const dynamic = "force-dynamic";

export default async function AdminAboutPreview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const content = await getDraftContent();
  return (
    <div className="admin-preview">
      <div className="admin-preview-banner">
        Aperçu privé du brouillon — rien ici n’est encore publié
      </div>
      <AboutView
        locale={locale}
        content={content}
        routeBase="/admin/preview"
      />
    </div>
  );
}
