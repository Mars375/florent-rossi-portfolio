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

test("publishing explains when a Vimeo link was pasted into the page address", async () => {
  const invalidDraft = structuredClone(defaultContent);
  invalidDraft.projects[0].slug =
    "https://vimeo.com/967736424?turnstile=temporary";

  const result = await publishDraftWithRepository(invalidDraft, {
    async publish() {
      assert.fail("invalid content must not be published");
    },
  });

  assert.deepEqual(result, {
    ok: false,
    message:
      "Publication impossible : Projet 1 — l’adresse de la page accepte seulement des lettres minuscules, des chiffres et des tirets. Pour Vimeo ou YouTube, utilisez « Lien du film complet ».",
  });
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
  assert.equal(publishedName, "Florent Rossi");
});
