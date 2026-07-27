import assert from "node:assert/strict";
import test from "node:test";
import { defaultContent } from "../lib/content/fallback";
import {
  createSerialTaskQueue,
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

test("serializes autosaves in the order they were queued", async () => {
  const order: string[] = [];
  const queue = createSerialTaskQueue();

  const first = queue.run(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    order.push("first");
  });
  const second = queue.run(async () => {
    order.push("second");
  });

  await Promise.all([first, second]);
  assert.deepEqual(order, ["first", "second"]);
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
