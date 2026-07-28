"use client";

import { useState, type FormEvent } from "react";
import { isAdminEmail } from "../../../lib/auth";
import { adminAuthCallbackUrl } from "../../../lib/site-url";
import { createBrowserSupabaseClient } from "../../../lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    if (!isAdminEmail(email)) {
      setStatus("sent");
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = adminAuthCallbackUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) throw error;
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label htmlFor="admin-email">Adresse e-mail</label>
      <input
        id="admin-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Envoi…" : "Recevoir le lien magique"}
      </button>
      {status === "sent" ? (
        <p role="status">
          Si cette adresse est autorisée, le lien de connexion vient d’être
          envoyé.
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert">
          Le service de connexion est momentanément indisponible. Réessayez dans
          quelques instants.
        </p>
      ) : null}
    </form>
  );
}
