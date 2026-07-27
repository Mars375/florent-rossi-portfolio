import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isAdminEmail } from "../../../lib/auth";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { signOutAction } from "../auth-actions";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  if (!isAdminEmail(user.email)) {
    return (
      <main className="admin-forbidden">
        <p className="section-label">Accès refusé</p>
        <h1>Ce compte n’est pas autorisé.</h1>
        <form action={signOutAction}>
          <button type="submit">Se déconnecter</button>
        </form>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link href="/admin">Atelier Vif / Admin</Link>
        <span>{user.email}</span>
        <form action={signOutAction}>
          <button type="submit">Déconnexion</button>
        </form>
      </header>
      {children}
    </div>
  );
}
