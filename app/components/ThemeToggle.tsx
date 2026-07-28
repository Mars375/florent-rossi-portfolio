"use client";

import { useEffect, useState } from "react";
import type { Locale } from "../../content/schema";
import {
  applyTheme,
  isTheme,
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "../../lib/theme";

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const sync = () => {
      const stored = readStoredTheme();
      const rootTheme = document.documentElement.dataset.theme;
      const resolved = isTheme(stored)
        ? stored
        : isTheme(rootTheme)
          ? rootTheme
          : resolveTheme(null, media.matches);
      applyTheme(resolved);
      setTheme(resolved);
    };

    const followSystem = () => {
      if (!isTheme(readStoredTheme())) {
        const resolved = resolveTheme(null, media.matches);
        applyTheme(resolved);
        setTheme(resolved);
      }
    };

    sync();
    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, []);

  const target = nextTheme(theme);
  const label =
    locale === "fr"
      ? target === "dark"
        ? "Activer le mode sombre"
        : "Activer le mode clair"
      : target === "dark"
        ? "Enable dark mode"
        : "Enable light mode";

  return (
    <button
      className="theme-toggle focus-ring"
      type="button"
      aria-label={label}
      aria-pressed={theme === "dark"}
      onClick={() => {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, target);
        } catch {
          // The visual change still works when storage is unavailable.
        }
        applyTheme(target);
        setTheme(target);
      }}
    >
      <span aria-hidden="true">{target === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}
