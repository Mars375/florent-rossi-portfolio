import assert from "node:assert/strict";
import test from "node:test";
import { defaultContent } from "../lib/content/fallback";
import {
  createContentRepository,
  type ContentStore,
} from "../lib/content/repository";

function fakeStore(overrides: Partial<ContentStore> = {}): ContentStore {
  return {
    read: async () => null,
    writeDraft: async () => undefined,
    publish: async () => undefined,
    ...overrides,
  };
}

test("falls back to checked-in JSON when published content is unavailable", async () => {
  const repository = createContentRepository(
    fakeStore({
      read: async () => {
        throw new Error("offline");
      },
    }),
  );

  assert.equal(
    (await repository.getPublished()).site.name,
    defaultContent.site.name,
  );
});

test("uses the checked-in JSON for a missing first draft", async () => {
  const repository = createContentRepository(fakeStore());

  assert.deepEqual(await repository.getDraft(), defaultContent);
});

test("does not hide remote errors while reading the admin draft", async () => {
  const repository = createContentRepository(
    fakeStore({
      read: async () => {
        throw new Error("database unavailable");
      },
    }),
  );

  await assert.rejects(
    () => repository.getDraft(),
    /database unavailable/,
  );
});

test("validates before writing a draft", async () => {
  let writeCalls = 0;
  const repository = createContentRepository(
    fakeStore({
      writeDraft: async () => {
        writeCalls += 1;
      },
    }),
  );

  await assert.rejects(() => repository.saveDraft({ schemaVersion: 1 }));
  assert.equal(writeCalls, 0);
});
