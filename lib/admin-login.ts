import { isAdminEmail } from "./auth";

export async function requestAdminMagicLink(
  email: string,
  sendOtp: (email: string) => Promise<void>,
): Promise<boolean> {
  if (!isAdminEmail(email)) return true;

  try {
    await sendOtp(email.trim());
    return true;
  } catch {
    return false;
  }
}
