import assert from "node:assert/strict";
import test from "node:test";
import { defaultContent } from "../lib/content/fallback";
import { publishDraftWithRepository } from "../lib/content/editor";

test("publishing validates the draft before invoking storage", async () => {
  let saveCalls = 0;
  let publishCalls = 0;
  const invalidDraft = structuredClone(defaultContent) as unknown as {
    site: { name: string };
  };
  invalidDraft.site.name = "";

  const result = await publishDraftWithRepository(invalidDraft, {
    async saveDraft() {
      saveCalls += 1;
      return defaultContent;
    },
    async publish() {
      publishCalls += 1;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(saveCalls, 0);
  assert.equal(publishCalls, 0);
});

test("publishing saves and publishes a valid draft", async () => {
  const calls: string[] = [];
  const result = await publishDraftWithRepository(defaultContent, {
    async saveDraft(content) {
      calls.push(content.site.name);
      return content;
    },
    async publish() {
      calls.push("published");
    },
  });

  assert.deepEqual(result, {
    ok: true,
    message: "Portfolio publié.",
  });
  assert.deepEqual(calls, ["Atelier Vif", "published"]);
});
