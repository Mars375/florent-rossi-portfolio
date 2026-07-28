"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "../../lib/auth";
import {
  publishDraftContent,
  saveDraftContent,
} from "../../lib/content/repository";
import {
  portfolioErrorMessage,
  publishDraftWithRepository,
  type ActionResult,
} from "../../lib/content/editor";
import { unusedPortfolioMediaPaths } from "../../lib/content/media";
import { parsePortfolioContent } from "../../content/schema";
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

  return supabase;
}

export async function saveDraftAction(value: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    await saveDraftContent(value);
    return { ok: true, message: "Brouillon enregistré." };
  } catch (error) {
    return {
      ok: false,
      message: `Enregistrement impossible : ${portfolioErrorMessage(error)}`,
    };
  }
}

export async function publishDraftAction(
  value: unknown,
  pendingMediaUrls: string[] = [],
): Promise<ActionResult> {
  let supabase;
  try {
    supabase = await requireAdmin();
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

    try {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const urls = Array.isArray(pendingMediaUrls)
        ? pendingMediaUrls.filter(
            (url): url is string => typeof url === "string",
          )
        : [];
      const paths = projectUrl
        ? unusedPortfolioMediaPaths(
            urls,
            parsePortfolioContent(value),
            projectUrl,
          )
        : [];

      if (paths.length > 0) {
        const { error } = await supabase.storage
          .from("portfolio-media")
          .remove(paths);
        if (error) throw error;
      }
    } catch {
      return {
        ok: true,
        message:
          "Portfolio publié. Certains anciens médias n’ont pas pu être nettoyés et restent disponibles sans affecter le site.",
      };
    }
  }

  return result;
}
