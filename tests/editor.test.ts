import assert from "node:assert/strict";
import test from "node:test";
import { defaultContent } from "../lib/content/fallback";
import {
  duplicateProject,
  reorderProjects,
} from "../lib/content/editor";

test("reorders projects without changing their content", () => {
  const reordered = reorderProjects(defaultContent.projects, [
    "nuit-35",
    "afterdark",
  ]);

  assert.equal(reordered[0].id, "nuit-35");
  assert.equal(reordered[0].order, 1);
  assert.equal(reordered[1].id, "afterdark");
  assert.equal(reordered[1].order, 2);
  assert.equal(reordered.length, defaultContent.projects.length);
});

test("duplicates a project with unique identifiers", () => {
  const source = defaultContent.projects[0];
  const duplicated = duplicateProject(source, defaultContent.projects);

  assert.notEqual(duplicated.id, source.id);
  assert.notEqual(duplicated.slug, source.slug);
  assert.equal(duplicated.status, "hidden");
  assert.equal(duplicated.order, defaultContent.projects.length + 1);
  assert.deepEqual(duplicated.title, {
    en: `${source.title.en} — copy`,
    fr: `${source.title.fr} — copie`,
  });
});
