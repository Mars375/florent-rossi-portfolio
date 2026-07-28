import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LegalEditor } from "../app/admin/components/LegalEditor";
import { defaultLegalContent } from "../content/legal";

test("renders shared hosting and complete bilingual legal fields", () => {
  const markup = renderToStaticMarkup(
    <LegalEditor value={defaultLegalContent} onChange={() => undefined} />,
  );

  assert.match(markup, /Dernière mise à jour/);
  assert.match(markup, /Vercel Inc\./);
  assert.match(markup, /Français/);
  assert.match(markup, /English/);
  assert.match(markup, /Mentions légales/);
  assert.match(markup, /Privacy/);
  assert.match(markup, /Charger la vidéo/);
  assert.match(markup, /Load video/);
});
