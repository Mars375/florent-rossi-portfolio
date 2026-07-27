const DEFAULT_ADMIN_EMAIL = "m.rossiflorent@gmail.com";

export function configuredAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === configuredAdminEmail();
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
