import assert from "node:assert/strict";
import test from "node:test";
import ProtectedAdminLayout from "../app/admin/(protected)/layout";

test("redirects an unconfigured protected admin route to login", async () => {
  await assert.rejects(
    () => ProtectedAdminLayout({ children: null }),
    (error: { digest?: string }) =>
      error.digest === "NEXT_REDIRECT;replace;/admin/login;307;",
  );
});
