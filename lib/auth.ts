const DEFAULT_ADMIN_EMAIL = "m.rossiflorent@gmail.com";

export function configuredAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === configuredAdminEmail();
}
