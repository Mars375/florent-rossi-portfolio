const DEFAULT_ADMIN_EMAIL = "m.rossiflorent@gmail.com";

function normalizeEmailList(value: string | undefined): string[] {
  if (!value) return [];

  return [
    ...new Set(
      value
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function configuredAdminEmails(): string[] {
  const configured = normalizeEmailList(process.env.ADMIN_EMAILS);
  if (configured.length > 0) return configured;

  const legacy = normalizeEmailList(process.env.ADMIN_EMAIL);
  return legacy.length > 0 ? legacy : [DEFAULT_ADMIN_EMAIL];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/admin";

  try {
    const url = new URL(value, "https://atelier-vif.local");
    if (url.origin !== "https://atelier-vif.local") return "/admin";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}
