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
});

test("keeps Turbopack scoped to this repository", async () => {
  const nextConfig = await readFile("next.config.ts", "utf8");

  assert.match(nextConfig, /root:\s*process\.cwd\(\)/);
});

test("excludes isolated worktrees from repository-wide linting", async () => {
  const eslintConfig = await readFile("eslint.config.mjs", "utf8");

  assert.match(eslintConfig, /["']\.worktrees\/\*\*["']/);
});
