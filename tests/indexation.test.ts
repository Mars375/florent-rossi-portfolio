import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { generateMetadata as generateHomeMetadata } from "../app/[locale]/page";
import { generateMetadata as generateAboutMetadata } from "../app/[locale]/about/page";
import { generateMetadata as generateLegalMetadata } from "../app/[locale]/legal/page";
import { generateMetadata as generatePrivacyMetadata } from "../app/[locale]/privacy/page";
import { generateMetadata as generateWorkMetadata } from "../app/[locale]/work/[slug]/page";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { metadata as loginMetadata } from "../app/admin/login/page";

function href(value: unknown): string {
  assert.ok(value);
  return value instanceof URL ? value.href : String(value);
}

function first<T>(value: T | T[] | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value;
}

test("publishes a robots policy that indexes public routes but excludes every admin URL", () => {
  assert.equal(existsSync("app/robots.ts"), true);
  assert.equal(existsSync("app/sitemap.ts"), true);

  assert.deepEqual(robots(), {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] },
    sitemap: "https://florentrossi.com/sitemap.xml",
  });
});

test("admin, login and previews publish noindex nofollow metadata", async () => {
  assert.deepEqual(loginMetadata.robots, { index: false, follow: false });

  const protectedLayout = await readFile(
    "app/admin/(protected)/layout.tsx",
    "utf8",
  );
  for (const path of ["/admin", "/admin/preview/fr"]) {
    assert.match(
      protectedLayout,
      /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/,
      `${path} must inherit protected noindex metadata`,
    );
  }
});

test("sitemap covers each locale's static public and published project routes", async () => {
  const urls = (await sitemap()).map((entry) => entry.url);

  for (const locale of ["fr", "en"]) {
    for (const path of ["", "/about", "/legal", "/privacy", "/work/afterdark"]) {
      assert.ok(urls.includes(`https://florentrossi.com/${locale}${path}`));
    }
  }
  assert.equal(urls.some((url) => url.includes("/admin")), false);
});

test("sitemap is explicitly dynamic rather than a build snapshot", async () => {
  const source = await readFile("app/sitemap.ts", "utf8");
  assert.match(source, /export const dynamic = "force-dynamic"/);
});

test("public pages resolve a complete Open Graph card with their canonical URLs", async () => {
  const [home, about, legal, privacy, work] = await Promise.all([
    generateHomeMetadata({ params: Promise.resolve({ locale: "fr" }) }),
    generateAboutMetadata({ params: Promise.resolve({ locale: "en" }) }),
    generateLegalMetadata({ params: Promise.resolve({ locale: "fr" }) }),
    generatePrivacyMetadata({ params: Promise.resolve({ locale: "en" }) }),
    generateWorkMetadata({
      params: Promise.resolve({ locale: "fr", slug: "afterdark" }),
    }),
  ]);

  const expected = [
    [home, "https://florentrossi.com/fr"],
    [about, "https://florentrossi.com/en/about"],
    [legal, "https://florentrossi.com/fr/legal"],
    [privacy, "https://florentrossi.com/en/privacy"],
    [work, "https://florentrossi.com/fr/work/afterdark"],
  ] as const;

  for (const [metadata, url] of expected) {
    assert.equal(href(metadata.openGraph?.url), url);
    assert.equal((metadata.openGraph as { type?: string } | undefined)?.type, "website");
    const image = first(metadata.openGraph?.images);
    assert.ok(image && typeof image === "object" && "url" in image);
    assert.equal(
      href(image.url),
      "https://florentrossi.com/og.png",
    );
    assert.ok(metadata.openGraph?.title);
    assert.ok(metadata.openGraph?.description);
  }
});
