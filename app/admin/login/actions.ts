"use server";

import { requestAdminMagicLink } from "../../../lib/admin-login";
import { adminAuthCallbackUrl } from "../../../lib/site-url";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export async function requestAdminMagicLinkAction(
  email: string,
): Promise<boolean> {
  return requestAdminMagicLink(email, async (authorizedEmail) => {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: authorizedEmail,
      options: {
        emailRedirectTo: adminAuthCallbackUrl(),
        shouldCreateUser: true,
      },
    });

    if (error) throw error;
  });
}
