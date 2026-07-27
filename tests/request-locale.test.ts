import assert from "node:assert/strict";
import test from "node:test";
import {
  documentLanguage,
  localeFromPathname,
} from "../lib/request-locale";

test("marks French and English public routes with their document languages", () => {
  assert.equal(documentLanguage(localeFromPathname("/fr")), "fr");
  assert.equal(documentLanguage(localeFromPathname("/fr/work/afterdark")), "fr");
  assert.equal(documentLanguage(localeFromPathname("/en/about")), "en");
});

test("uses English as the document-language fallback for admin routes", () => {
  assert.equal(localeFromPathname("/admin"), null);
  assert.equal(localeFromPathname("/admin/preview/fr"), null);
  assert.equal(documentLanguage(null), "en");
});
