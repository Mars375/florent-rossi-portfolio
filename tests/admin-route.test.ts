import assert from "node:assert/strict";
import test from "node:test";
import ProtectedAdminLayout from "../app/admin/(protected)/layout";

test("redirects an unconfigured protected admin route to login", async () => {
  const original = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  try {
    await assert.rejects(
      () => ProtectedAdminLayout({ children: null }),
      (error: { digest?: string }) =>
        error.digest === "NEXT_REDIRECT;replace;/admin/login;307;",
    );
  } finally {
    if (original.url === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = original.url;
    }
    if (original.publishableKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = original.publishableKey;
    }
  }
});
