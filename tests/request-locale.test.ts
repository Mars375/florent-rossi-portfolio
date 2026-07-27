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

test("uses French as the document language for French admin routes", () => {
  assert.equal(documentLanguage(localeFromPathname("/admin")), "fr");
  assert.equal(documentLanguage(localeFromPathname("/admin/login")), "fr");
  assert.equal(documentLanguage(localeFromPathname("/admin/projects")), "fr");
});

test("preserves the selected language in admin preview routes", () => {
  assert.equal(documentLanguage(localeFromPathname("/admin/preview/fr")), "fr");
  assert.equal(
    documentLanguage(localeFromPathname("/admin/preview/fr/work/afterdark")),
    "fr",
  );
  assert.equal(documentLanguage(localeFromPathname("/admin/preview/en/about")), "en");
});

test("uses English for unknown routes", () => {
  assert.equal(localeFromPathname("/not-a-route"), null);
  assert.equal(documentLanguage(null), "en");
});
