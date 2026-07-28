import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { generateMetadata as generateHomeMetadata } from "../app/[locale]/page";
import { generateMetadata as generateAboutMetadata } from "../app/[locale]/about/page";
import { generateMetadata as generateWorkMetadata } from "../app/[locale]/work/[slug]/page";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

function href(value: unknown): string {
  assert.ok(value);
  return value instanceof URL ? value.href : String(value);
}

test("publishes a robots policy that indexes public routes but excludes admin", () => {
  assert.equal(existsSync("app/robots.ts"), true);
  assert.equal(existsSync("app/sitemap.ts"), true);

  assert.deepEqual(robots(), {
    rules: { userAgent: "*", allow: "/", disallow: "/admin/" },
    sitemap: "https://florentrossi.com/sitemap.xml",
  });
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

test("public page metadata declares its canonical Open Graph URL", async () => {
  const [home, about, work] = await Promise.all([
    generateHomeMetadata({ params: Promise.resolve({ locale: "fr" }) }),
    generateAboutMetadata({ params: Promise.resolve({ locale: "en" }) }),
    generateWorkMetadata({
      params: Promise.resolve({ locale: "fr", slug: "afterdark" }),
    }),
  ]);

  assert.equal(href(home.openGraph?.url), "https://florentrossi.com/fr");
  assert.equal(href(about.openGraph?.url), "https://florentrossi.com/en/about");
  assert.equal(
    href(work.openGraph?.url),
    "https://florentrossi.com/fr/work/afterdark",
  );
});
