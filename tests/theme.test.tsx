import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeToggle } from "../app/components/ThemeToggle";
import {
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  themeBootstrapScript,
} from "../lib/theme";

type BootstrapOptions = {
  stored: string | null;
  systemDark: boolean;
  storageThrows?: boolean;
};

function executeBootstrap({
  stored,
  systemDark,
  storageThrows = false,
}: BootstrapOptions) {
  const document = {
    documentElement: {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
    },
  };

  runInNewContext(themeBootstrapScript(), {
    document,
    window: {
      matchMedia: () => ({ matches: systemDark }),
    },
    localStorage: {
      getItem: () => {
        if (storageThrows) throw new Error("storage unavailable");
        return stored;
      },
    },
  });

  return document.documentElement;
}

test("stored theme takes precedence over the system preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(null, false), "light");
  assert.equal(resolveTheme("sepia", true), "dark");
});

test("theme toggle always selects the opposite explicit theme", () => {
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "light");
});

test("bootstrap applies storage, system fallback and color scheme before hydration", () => {
  assert.equal(THEME_STORAGE_KEY, "florent-rossi-theme");

  const stored = executeBootstrap({ stored: "light", systemDark: true });
  assert.equal(stored.dataset.theme, "light");
  assert.equal(stored.style.colorScheme, "light");

  const system = executeBootstrap({ stored: null, systemDark: true });
  assert.equal(system.dataset.theme, "dark");
  assert.equal(system.style.colorScheme, "dark");

  const unavailable = executeBootstrap({
    stored: null,
    systemDark: true,
    storageThrows: true,
  });
  assert.equal(unavailable.dataset.theme, "dark");
  assert.equal(unavailable.style.colorScheme, "dark");
});

test("toggle renders a localized accessible initial action", () => {
  const french = renderToStaticMarkup(<ThemeToggle locale="fr" />);
  const english = renderToStaticMarkup(<ThemeToggle locale="en" />);

  assert.match(french, /aria-label="Activer le mode sombre"/);
  assert.match(french, /aria-pressed="false"/);
  assert.match(english, /aria-label="Enable dark mode"/);
});
