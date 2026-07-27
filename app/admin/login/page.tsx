import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Administration",
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login">
      <div>
        <p className="section-label">Atelier Vif / Administration</p>
        <h1>Faire évoluer le portfolio.</h1>
        <p>
          Utilisez l’adresse autorisée pour recevoir un lien de connexion
          sécurisé.
        </p>
        <LoginForm />
        <Link className="arrow-link" href="/fr">
          ← Retour au site
        </Link>
      </div>
    </main>
  );
}
