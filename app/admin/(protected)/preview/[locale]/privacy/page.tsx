import { notFound } from "next/navigation";
import { LegalView } from "../../../../../components/LegalView";
import { isLocale } from "../../../../../../lib/content/locales";
import { getDraftContent } from "../../../../../../lib/content/repository";

export const dynamic = "force-dynamic";

export default async function AdminPrivacyPreview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="admin-preview">
      <div className="admin-preview-banner">
        Aperçu privé du brouillon — rien ici n’est encore publié
      </div>
      <LegalView
        locale={locale}
        content={await getDraftContent()}
        kind="privacy"
        routeBase="/admin/preview"
      />
    </div>
  );
}
