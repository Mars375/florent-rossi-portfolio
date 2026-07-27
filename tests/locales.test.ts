import assert from "node:assert/strict";
import test from "node:test";
import { localizedPath } from "../lib/content/locales";

test("switches both locale directions while preserving route and hash", () => {
  assert.equal(
    localizedPath("/en/work/afterdark#film", "fr"),
    "/fr/work/afterdark#film",
  );
  assert.equal(localizedPath("/fr/about", "en"), "/en/about");
});

test("adds a locale to unlocalized paths and preserves queries", () => {
  assert.equal(localizedPath("/?preview=1", "fr"), "/fr?preview=1");
});

test("switches locale inside protected preview routes", () => {
  assert.equal(
    localizedPath("/admin/preview/fr/work/afterdark#film", "en"),
    "/admin/preview/en/work/afterdark#film",
  );
});
