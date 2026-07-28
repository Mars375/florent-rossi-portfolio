import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";
import { ProjectCard } from "../app/components/ProjectCard";

const project = parsePortfolioContent(content).projects[0];

test("renders only the static poster before an eligible interaction", () => {
  const markup = renderToStaticMarkup(
    <ProjectCard
      project={project}
      locale="fr"
      playingLabel="En lecture"
      viewLabel="Voir le projet"
    />,
  );

  assert.match(markup, /src="\/media\/florent\/afterdark-poster\.jpg"/);
  assert.doesNotMatch(markup, /afterdark-preview\.gif/);
  assert.doesNotMatch(markup, /afterdark-loop\.mp4/);
  assert.doesNotMatch(markup, /<video/);
  assert.match(markup, /En lecture 00:03/);
});

test("card and case-study media styles never scale media on hover", async () => {
  const root = postcss.parse(await readFile("app/globals.css", "utf8"));
  const forbidden: string[] = [];

  root.walkRules((rule) => {
    const targetsCardHover =
      rule.selector.includes(".project-media:hover") ||
      rule.selector.includes(".project-media:focus-within");
    const targetsCaseHover = rule.selector.includes(".case-film:hover");
    const targetsCardMedia =
      rule.selector.includes(".project-media img") ||
      rule.selector.includes(".project-media video");

    rule.walkDecls((declaration) => {
      if (
        (targetsCardHover || targetsCaseHover) &&
        declaration.prop === "transform" &&
        declaration.value.includes("scale(")
      ) {
        forbidden.push(`${rule.selector}: ${declaration.toString()}`);
      }

      if (
        targetsCardMedia &&
        declaration.prop === "transition" &&
        declaration.value.includes("transform")
      ) {
        forbidden.push(`${rule.selector}: ${declaration.toString()}`);
      }
    });
  });

  assert.deepEqual(forbidden, []);
});
