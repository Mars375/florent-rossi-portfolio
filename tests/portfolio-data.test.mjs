import assert from "node:assert/strict";
import test from "node:test";

import {
  alternateLocalePath,
  canAutoplayPreview,
  getDictionary,
  getProjectBySlug,
  projects,
} from "../app/data/portfolio.mjs";

test("publishes a complete bilingual project catalogue", () => {
  assert.equal(projects.length, 5);

  for (const project of projects) {
    assert.ok(project.slug);
    assert.ok(project.title.en);
    assert.ok(project.title.fr);
    assert.ok(project.discipline.en);
    assert.ok(project.discipline.fr);
    assert.match(project.poster, /^https:\/\//);
    assert.match(project.previewVideo, /^https:\/\//);
  }
});

test("resolves the featured case study by slug", () => {
  const project = getProjectBySlug("afterdark");

  assert.equal(project?.year, "2026");
  assert.equal(project?.title.fr, "Afterdark");
  assert.equal(getProjectBySlug("missing"), undefined);
});

test("provides complete English and French navigation dictionaries", () => {
  const en = getDictionary("en");
  const fr = getDictionary("fr");

  assert.equal(en.nav.work, "Work");
  assert.equal(fr.nav.work, "Projets");
  assert.equal(en.hero.lineOne, "Ideas move.");
  assert.equal(fr.hero.lineOne, "Les idées bougent.");
});

test("preserves the current page when changing locale", () => {
  assert.equal(alternateLocalePath("/en/work/afterdark", "fr"), "/fr/work/afterdark");
  assert.equal(alternateLocalePath("/fr/about", "en"), "/en/about");
  assert.equal(alternateLocalePath("/", "fr"), "/fr");
});

test("autoplays previews only for hover-capable users without reduced motion", () => {
  assert.equal(
    canAutoplayPreview({ hoverCapable: true, reduceMotion: false }),
    true,
  );
  assert.equal(
    canAutoplayPreview({ hoverCapable: false, reduceMotion: false }),
    false,
  );
  assert.equal(
    canAutoplayPreview({ hoverCapable: true, reduceMotion: true }),
    false,
  );
});
