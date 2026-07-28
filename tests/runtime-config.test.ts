import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses the Vercel-compatible Next runtime", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(pkg.scripts.dev, "next dev");
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.scripts.start, "next start");
  assert.ok(pkg.dependencies["@supabase/ssr"]);
  assert.ok(pkg.dependencies["@supabase/supabase-js"]);
  assert.ok(pkg.dependencies.zod);

  const [major, minor, patch] = pkg.dependencies.next
    .split(".")
    .map(Number);
  assert.ok(
    major > 16 || (major === 16 && (minor > 2 || (minor === 2 && patch >= 12))),
    "Next.js must include the 16.2.12 security fixes",
  );
});

test("keeps Turbopack scoped to this repository", async () => {
  const nextConfig = await readFile("next.config.ts", "utf8");

  assert.match(nextConfig, /root:\s*process\.cwd\(\)/);
});

test("caches versioned portfolio media immutably at the edge", async () => {
  const nextConfig = await readFile("next.config.ts", "utf8");

  assert.match(nextConfig, /source:\s*["']\/media\/florent\/:path\*["']/);
  assert.match(nextConfig, /key:\s*["']Cache-Control["']/);
  assert.match(
    nextConfig,
    /value:\s*["']public, max-age=31536000, immutable["']/,
  );
});

test("excludes isolated worktrees from repository-wide linting", async () => {
  const eslintConfig = await readFile("eslint.config.mjs", "utf8");

  assert.match(eslintConfig, /["']\.worktrees\/\*\*["']/);
});
