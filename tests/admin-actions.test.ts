import assert from "node:assert/strict";
import test from "node:test";
import { defaultContent } from "../lib/content/fallback";
import { publishDraftWithRepository } from "../lib/content/editor";

test("publishing validates the draft before invoking storage", async () => {
  let publishCalls = 0;
  const invalidDraft = structuredClone(defaultContent) as unknown as {
    site: { name: string };
  };
  invalidDraft.site.name = "";

  const result = await publishDraftWithRepository(invalidDraft, {
    async publish() {
      publishCalls += 1;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(publishCalls, 0);
});

test("publishing passes the validated document to one atomic operation", async () => {
  let publishedName = "";
  const result = await publishDraftWithRepository(defaultContent, {
    async publish(content) {
      publishedName = content.site.name;
    },
  });

  assert.deepEqual(result, {
    ok: true,
    message: "Portfolio publié.",
  });
  assert.equal(publishedName, "Atelier Vif");
});
