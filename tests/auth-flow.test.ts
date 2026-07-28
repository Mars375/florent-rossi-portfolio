import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { safeNextPath } from "../lib/auth";

test("keeps authentication redirects on the same origin", () => {
  assert.equal(safeNextPath("/admin?tab=projects"), "/admin?tab=projects");
  assert.equal(safeNextPath("https://evil.example/"), "/admin");
  assert.equal(safeNextPath("//evil.example/"), "/admin");
  assert.equal(safeNextPath(null), "/admin");
});

test("forwards Supabase anti-cache headers on authenticated routes", async () => {
  const source = await readFile("proxy.ts", "utf8");
  assert.match(source, /setAll\(values,\s*headers\)/);
  assert.match(source, /response\.headers\.set\(key,\s*value\)/);
});

test("accepts both PKCE codes and token-hash email templates", async () => {
  const source = await readFile("app/auth/confirm/route.ts", "utf8");
  assert.match(source, /searchParams\.get\("code"\)/);
  assert.match(source, /exchangeCodeForSession\(code\)/);
  assert.match(source, /verifyOtp/);
});

test("login keeps the canonical callback helper in its server action", async () => {
  const [clientSource, actionSource] = await Promise.all([
    readFile("app/admin/login/LoginForm.tsx", "utf8"),
    readFile("app/admin/login/actions.ts", "utf8"),
  ]);
  assert.match(clientSource, /requestAdminMagicLinkAction/);
  assert.doesNotMatch(clientSource, /window\.location\.origin/);
  assert.match(actionSource, /adminAuthCallbackUrl\(\)/);
});
