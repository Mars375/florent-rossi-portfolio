import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectEditor } from "../app/admin/components/ProjectEditor";
import { defaultContent } from "../lib/content/fallback";

test("distinguishes the public page address from the full video link", () => {
  const markup = renderToStaticMarkup(
    <ProjectEditor
      project={defaultContent.projects[0]}
      index={0}
      total={defaultContent.projects.length}
      onChange={() => undefined}
      onMove={() => undefined}
      onDuplicate={() => undefined}
      onDelete={() => undefined}
      onQueueMediaDelete={() => undefined}
    />,
  );

  assert.match(markup, /Adresse de la page/);
  assert.match(markup, /Exemple : afterdark/);
  assert.match(markup, /Ne collez pas de lien Vimeo ou YouTube ici/);
  assert.match(markup, /Lien du film complet/);
  assert.match(markup, /https:\/\/vimeo\.com\/967736424/);
  assert.doesNotMatch(markup, />URL du projet</);
});
