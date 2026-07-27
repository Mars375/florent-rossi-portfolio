"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "../../lib/auth";
import {
  publishDraftContent,
  saveDraftContent,
} from "../../lib/content/repository";
import {
  publishDraftWithRepository,
  type ActionResult,
} from "../../lib/content/editor";
import { createServerSupabaseClient } from "../../lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !isAdminEmail(user.email)) {
    throw new Error("Session administrateur invalide.");
  }
}

export async function saveDraftAction(value: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    await saveDraftContent(value);
    return { ok: true, message: "Brouillon enregistré." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Enregistrement impossible : ${error.message}`
          : "Enregistrement impossible.",
    };
  }
}

export async function publishDraftAction(value: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Session administrateur invalide.",
    };
  }

  const result = await publishDraftWithRepository(value, {
    publish: publishDraftContent,
  });

  if (result.ok) {
    revalidatePath("/", "layout");
  }

  return result;
}
