import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the English portfolio homepage", async () => {
  const response = await render("/en");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Ideas move\./);
  assert.match(html, /Afterdark/);
  assert.match(html, /Selected work 2022/);
  assert.match(html, /href="\/fr"/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("renders the French portfolio homepage", async () => {
  const response = await render("/fr");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Les idées bougent\./);
  assert.match(html, /Projets choisis 2022/);
  assert.match(html, /href="\/en"/);
});

test("renders the featured bilingual case study", async () => {
  const response = await render("/en/work/afterdark");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Night becomes a frequency/);
  assert.match(html, /Studio Mirage/);
  assert.match(html, /Back to all work/);
});

test("renders the French studio and contact page", async () => {
  const response = await render("/fr/about");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Un studio pour les idées/);
  assert.match(html, /ÉCOUTER/);
  assert.match(html, /HELLO@ATELIERVIF\.COM/i);
});

test("removes the disposable starter preview", async () => {
  await assert.rejects(
    access(new URL("../app/_sites-preview", import.meta.url)),
  );
});
