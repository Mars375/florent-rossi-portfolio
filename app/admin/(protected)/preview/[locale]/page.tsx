import { notFound } from "next/navigation";
import { PortfolioHome } from "../../../../components/PortfolioHome";
import { isLocale } from "../../../../../lib/content/locales";
import { getDraftContent } from "../../../../../lib/content/repository";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage({
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
      <PortfolioHome locale={locale} content={content} />
    </div>
  );
}
