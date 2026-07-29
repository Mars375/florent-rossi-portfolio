import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { register } from "node:module";
import test from "node:test";
import { generateMetadata as generateHomeMetadata } from "../app/[locale]/page";
import { generateMetadata as generateAboutMetadata } from "../app/[locale]/about/page";
import { generateMetadata as generateLegalMetadata } from "../app/[locale]/legal/page";
import { generateMetadata as generatePrivacyMetadata } from "../app/[locale]/privacy/page";
import { generateMetadata as generateWorkMetadata } from "../app/[locale]/work/[slug]/page";
import {
  adminAuthCallbackUrl,
  getSiteUrl,
  localizedAlternates,
  PRODUCTION_SITE_URL,
} from "../lib/site-url";

function href(value: unknown): string {
  assert.ok(value);
  return value instanceof URL ? value.href : String(value);
}

function first(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

async function loadRootMetadataGenerator() {
  const cssLoader = `
    export async function load(url, context, nextLoad) {
      if (url.endsWith(".css")) {
        return {
          format: "module",
          shortCircuit: true,
          source: "export default {};",
        };
      }
      return nextLoad(url, context);
    }
  `;
  register(
    `data:text/javascript,${encodeURIComponent(cssLoader)}`,
    import.meta.url,
  );

  return (await import("../app/layout")).generateMetadata;
}

test("uses florentrossi.com as the safe canonical production origin", () => {
  assert.equal(PRODUCTION_SITE_URL, "https://florentrossi.com");
  assert.equal(getSiteUrl("").href, "https://florentrossi.com/");
  assert.equal(
    getSiteUrl("https://preview.example.com").href,
    "https://preview.example.com/",
  );
  assert.equal(
    getSiteUrl("javascript:alert(1)").href,
    "https://florentrossi.com/",
  );
  assert.equal(
    getSiteUrl("https://user:pass@example.com").href,
    "https://florentrossi.com/",
  );
});

test("pins production admin authentication to florentrossi.com", () => {
  assert.equal(
    adminAuthCallbackUrl("http://localhost:3000", "production"),
    "https://florentrossi.com/auth/confirm?next=/admin",
  );
});

test("allows an explicitly configured localhost callback in development", () => {
  assert.equal(
    adminAuthCallbackUrl("http://localhost:3000", "development"),
    "http://localhost:3000/auth/confirm?next=/admin",
  );
});

test("pins non-development admin authentication to florentrossi.com", () => {
  for (const environment of ["test", "staging"]) {
    assert.equal(
      adminAuthCallbackUrl("http://localhost:3000", environment),
      "https://florentrossi.com/auth/confirm?next=/admin",
    );
  }
});

test("falls back to the canonical callback without NODE_ENV", () => {
  const environment = process.env as Record<string, string | undefined>;
  const previous = environment.NODE_ENV;

  try {
    delete environment.NODE_ENV;

    assert.equal(
      adminAuthCallbackUrl("http://localhost:3000"),
      "https://florentrossi.com/auth/confirm?next=/admin",
    );
  } finally {
    if (previous === undefined) {
      delete environment.NODE_ENV;
    } else {
      environment.NODE_ENV = previous;
    }
  }
});

test("builds exact FR and EN canonical alternates", () => {
  const home = localizedAlternates("fr");
  const project = localizedAlternates("en", "/work/afterdark");

  assert.equal(href(home?.canonical), "https://florentrossi.com/fr");
  assert.equal(href(home?.languages?.fr), "https://florentrossi.com/fr");
  assert.equal(href(home?.languages?.en), "https://florentrossi.com/en");
  assert.equal(
    href(project?.canonical),
    "https://florentrossi.com/en/work/afterdark",
  );
  assert.equal(
    href(project?.languages?.fr),
    "https://florentrossi.com/fr/work/afterdark",
  );
});

test("uses absolute strings so Next preserves distinct hreflang URLs", () => {
  const languages = localizedAlternates("fr")?.languages;

  assert.equal(typeof languages?.fr, "string");
  assert.equal(typeof languages?.en, "string");
  assert.equal(languages?.fr, "https://florentrossi.com/fr");
  assert.equal(languages?.en, "https://florentrossi.com/en");
});

test("public canonicals pin florentrossi.com despite legacy or preview environment origins", async () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  const generateRootMetadata = await loadRootMetadataGenerator();

  try {
    for (const environmentOrigin of [
      "https://florentrossi.fr",
      "https://portfolio-git-preview.vercel.app",
    ]) {
      process.env.NEXT_PUBLIC_SITE_URL = environmentOrigin;

      const [root, home, about, work] = await Promise.all([
        generateRootMetadata(),
        generateHomeMetadata({ params: Promise.resolve({ locale: "fr" }) }),
        generateAboutMetadata({ params: Promise.resolve({ locale: "en" }) }),
        generateWorkMetadata({
          params: Promise.resolve({ locale: "fr", slug: "afterdark" }),
        }),
      ]);

      assert.equal(href(root.metadataBase), "https://florentrossi.com/");
      const icon =
        root.icons &&
        typeof root.icons === "object" &&
        !Array.isArray(root.icons) &&
        "icon" in root.icons
          ? root.icons.icon
          : undefined;
      assert.equal(icon, "/favicon.svg");
      const openGraphImage = first(root.openGraph?.images);
      assert.ok(openGraphImage && typeof openGraphImage === "object");
      assert.ok("url" in openGraphImage);
      assert.equal(
        href(openGraphImage.url),
        "https://florentrossi.com/og.png",
      );
      assert.equal(
        href(first(root.twitter?.images)),
        "https://florentrossi.com/og.png",
      );
      assert.equal(
        href(home.alternates?.canonical),
        "https://florentrossi.com/fr",
      );
      assert.equal(
        href(about.alternates?.canonical),
        "https://florentrossi.com/en/about",
      );
      assert.equal(
        href(work.alternates?.canonical),
        "https://florentrossi.com/fr/work/afterdark",
      );
    }
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

  assert.equal(values.NEXT_PUBLIC_SITE_URL, "https://florentrossi.com");
});

test("legal routes publish exact localized canonical alternates", async () => {
  const [legal, privacy] = await Promise.all([
    generateLegalMetadata({ params: Promise.resolve({ locale: "fr" }) }),
    generatePrivacyMetadata({ params: Promise.resolve({ locale: "en" }) }),
  ]);

  assert.equal(
    href(legal.alternates?.canonical),
    "https://florentrossi.com/fr/legal",
  );
  assert.equal(
    href(legal.alternates?.languages?.en),
    "https://florentrossi.com/en/legal",
  );
  assert.equal(
    href(privacy.alternates?.canonical),
    "https://florentrossi.com/en/privacy",
  );
  assert.equal(
    href(privacy.alternates?.languages?.fr),
    "https://florentrossi.com/fr/privacy",
  );
});
