export const THEME_STORAGE_KEY = "florent-rossi-theme";
export const themes = ["light", "dark"] as const;
export type Theme = (typeof themes)[number];

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(
  stored: unknown,
  systemPrefersDark: boolean,
): Theme {
  if (isTheme(stored)) return stored;
  return systemPrefersDark ? "dark" : "light";
}

export function nextTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function themeBootstrapScript(): string {
  return `(function(){var d=document.documentElement;var m=window.matchMedia("(prefers-color-scheme: dark)");var t="light";try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");t=s==="light"||s==="dark"?s:(m.matches?"dark":"light");}catch(e){t=m.matches?"dark":"light";}d.dataset.theme=t;d.style.colorScheme=t;}());`;
}
