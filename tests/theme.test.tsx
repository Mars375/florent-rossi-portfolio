import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import postcss, { type Root, type Rule } from "postcss";
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

function tokens(rule: Rule): Record<string, string> {
  const values: Record<string, string> = {};
  rule.walkDecls(/^--/, (declaration) => {
    values[declaration.prop] = declaration.value;
  });
  return values;
}

function ruleFor(root: Root, selector: string): Rule {
  let match: Rule | undefined;
  root.walkRules((rule) => {
    if (rule.selector.split(",").map((value) => value.trim()).includes(selector)) {
      match = rule;
    }
  });
  assert.ok(match, `Missing CSS rule for ${selector}`);
  return match;
}

function declarationValue(root: Root, selector: string, property: string): string {
  const rule = ruleFor(root, selector);
  let value = "";
  rule.walkDecls(property, (declaration) => {
    value = declaration.value;
  });
  assert.ok(value, `Missing ${property} in ${selector}`);
  return value;
}

function luminance(hex: string): number {
  const channels = hex.match(/[0-9a-f]{2}/gi);
  assert.ok(channels);
  const [red, green, blue] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("CSS exposes the exact light and dark design tokens", async () => {
  const root = postcss.parse(await readFile("app/globals.css", "utf8"));
  const light = tokens(ruleFor(root, ":root[data-theme=\"light\"]"));
  const dark = tokens(ruleFor(root, ":root[data-theme=\"dark\"]"));

  assert.deepEqual(
    {
      paper: light["--paper"],
      ink: light["--ink"],
      coral: light["--coral"],
      acid: light["--acid"],
      muted: light["--muted"],
      line: light["--line"],
    },
    {
      paper: "#f2ebdd",
      ink: "#151515",
      coral: "#ff5b35",
      acid: "#dfff45",
      muted: "#746f65",
      line: "rgba(21, 21, 21, 0.32)",
    },
  );
  assert.deepEqual(
    {
      paper: dark["--paper"],
      ink: dark["--ink"],
      coral: dark["--coral"],
      acid: dark["--acid"],
      muted: dark["--muted"],
      line: dark["--line"],
    },
    {
      paper: "#11110f",
      ink: "#f2ebdd",
      coral: "#ff6a45",
      acid: "#dfff45",
      muted: "#b8b0a4",
      line: "rgba(242, 235, 221, 0.30)",
    },
  );
});

test("semantic foreground pairs meet WCAG AA for normal text", async () => {
  const root = postcss.parse(await readFile("app/globals.css", "utf8"));
  const light = tokens(ruleFor(root, ":root[data-theme=\"light\"]"));
  const dark = tokens(ruleFor(root, ":root[data-theme=\"dark\"]"));

  assert.ok(contrast(light["--ink"], light["--paper"]) >= 4.5);
  assert.ok(contrast(dark["--ink"], dark["--paper"]) >= 4.5);
  assert.ok(contrast(light["--accent-ink"], light["--coral"]) >= 4.5);
  assert.ok(contrast(dark["--accent-ink"], dark["--coral"]) >= 4.5);
  assert.ok(contrast(light["--accent-ink"], light["--acid"]) >= 4.5);
  assert.ok(contrast(light["--muted-text"], light["--paper"]) >= 4.5);
  assert.ok(contrast(dark["--muted-text"], dark["--paper"]) >= 4.5);
  assert.ok(contrast(light["--coral-text"], light["--paper"]) >= 4.5);
});

test("theme controls and admin editor receive their intended color schemes", async () => {
  const root = postcss.parse(await readFile("app/globals.css", "utf8"));

  assert.equal(
    declarationValue(root, ".locale-switch [aria-current=\"page\"]", "color"),
    "var(--coral-text)",
  );
  assert.equal(
    declarationValue(root, ".playing-badge", "color"),
    "var(--accent-ink)",
  );
  assert.equal(
    declarationValue(root, ".credits dt", "color"),
    "var(--muted-text)",
  );
  assert.equal(
    declarationValue(root, ".admin-shell", "color-scheme"),
    "light",
  );
  assert.equal(
    declarationValue(root, ".theme-toggle", "cursor"),
    "pointer",
  );
});
