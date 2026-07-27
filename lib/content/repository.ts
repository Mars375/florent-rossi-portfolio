import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parsePortfolioContent,
  type PortfolioContent,
} from "../../content/schema";
import { defaultContent } from "./fallback";
import {
  createPublicSupabaseClient,
  createServerSupabaseClient,
} from "../supabase/server";

export type ContentKey = "draft" | "published";

export type ContentStore = {
  read(key: ContentKey): Promise<unknown | null>;
  writeDraft(content: PortfolioContent): Promise<void>;
  publish(): Promise<void>;
};

export function createContentRepository(store: ContentStore) {
  return {
    async getPublished(): Promise<PortfolioContent> {
      try {
        const value = await store.read("published");
        return value ? parsePortfolioContent(value) : defaultContent;
      } catch {
        return defaultContent;
      }
    },

    async getDraft(): Promise<PortfolioContent> {
      const value = await store.read("draft");
      return value ? parsePortfolioContent(value) : defaultContent;
    },

    async saveDraft(value: unknown): Promise<PortfolioContent> {
      const content = parsePortfolioContent(value);
      await store.writeDraft(content);
      return content;
    },

    async publish(): Promise<void> {
      await store.publish();
    },
  };
}

function supabaseStore(client: SupabaseClient): ContentStore {
  return {
    async read(key) {
      const { data, error } = await client
        .from("portfolio_documents")
        .select("content")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      return data?.content ?? null;
    },

    async writeDraft(content) {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError) throw userError;

      const { error } = await client.from("portfolio_documents").upsert({
        key: "draft",
        content,
        updated_by: user?.id ?? null,
      });

      if (error) throw error;
    },

    async publish() {
      const { error } = await client.rpc("publish_portfolio");
      if (error) throw error;
    },
  };
}

export async function getPublishedContent(): Promise<PortfolioContent> {
  const client = createPublicSupabaseClient();
  if (!client) return defaultContent;
  return createContentRepository(supabaseStore(client)).getPublished();
}

export async function getDraftContent(): Promise<PortfolioContent> {
  const client = await createServerSupabaseClient();
  return createContentRepository(supabaseStore(client)).getDraft();
}

export async function saveDraftContent(
  value: unknown,
): Promise<PortfolioContent> {
  const client = await createServerSupabaseClient();
  return createContentRepository(supabaseStore(client)).saveDraft(value);
}

export async function publishDraftContent(): Promise<void> {
  const client = await createServerSupabaseClient();
  await createContentRepository(supabaseStore(client)).publish();
}
