import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { generateMetadata as generateHomeMetadata } from "../app/[locale]/page";
import { generateMetadata as generateAboutMetadata } from "../app/[locale]/about/page";
import { generateMetadata as generateWorkMetadata } from "../app/[locale]/work/[slug]/page";
import {
  getSiteUrl,
  localizedAlternates,
  PRODUCTION_SITE_URL,
} from "../lib/site-url";

function href(value: unknown): string {
  assert.ok(value);
  return value instanceof URL ? value.href : String(value);
}

test("uses florentrossi.fr as the safe canonical production origin", () => {
  assert.equal(PRODUCTION_SITE_URL, "https://florentrossi.fr");
  assert.equal(getSiteUrl("").href, "https://florentrossi.fr/");
  assert.equal(
    getSiteUrl("https://preview.example.com").href,
    "https://preview.example.com/",
  );
  assert.equal(
    getSiteUrl("javascript:alert(1)").href,
    "https://florentrossi.fr/",
  );
  assert.equal(
    getSiteUrl("https://user:pass@example.com").href,
    "https://florentrossi.fr/",
  );
});

test("builds exact FR and EN canonical alternates", () => {
  const home = localizedAlternates("fr", "", "");
  const project = localizedAlternates("en", "/work/afterdark", "");

  assert.equal(href(home?.canonical), "https://florentrossi.fr/fr");
  assert.equal(href(home?.languages?.fr), "https://florentrossi.fr/fr");
  assert.equal(href(home?.languages?.en), "https://florentrossi.fr/en");
  assert.equal(
    href(project?.canonical),
    "https://florentrossi.fr/en/work/afterdark",
  );
  assert.equal(
    href(project?.languages?.fr),
    "https://florentrossi.fr/fr/work/afterdark",
  );
});

test("public metadata exposes canonical localized routes on florentrossi.fr", async () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://florentrossi.fr";

  try {
    const [home, about, work] = await Promise.all([
      generateHomeMetadata({ params: Promise.resolve({ locale: "fr" }) }),
      generateAboutMetadata({ params: Promise.resolve({ locale: "en" }) }),
      generateWorkMetadata({
        params: Promise.resolve({ locale: "fr", slug: "afterdark" }),
      }),
    ]);

    assert.equal(href(home.alternates?.canonical), "https://florentrossi.fr/fr");
    assert.equal(
      href(about.alternates?.canonical),
      "https://florentrossi.fr/en/about",
    );
    assert.equal(
      href(work.alternates?.canonical),
      "https://florentrossi.fr/fr/work/afterdark",
    );
  } finally {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previous;
    }
  }
});

test("documents the canonical production origin in the environment example", async () => {
  const values = Object.fromEntries(
    (await readFile(".env.example", "utf8"))
      .split(/\r?\n/)
      .filter((line) => line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );

  assert.equal(values.NEXT_PUBLIC_SITE_URL, "https://florentrossi.fr");
});
