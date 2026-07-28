import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";
import {
  ProjectCard,
  shouldActivateProjectCardFocus,
  shouldShowProjectCardGif,
} from "../app/components/ProjectCard";

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

test("keeps a touch-origin focus static while allowing keyboard focus", () => {
  assert.equal(shouldActivateProjectCardFocus("pointer"), false);
  assert.equal(shouldActivateProjectCardFocus("keyboard"), true);
});

test("shows a directly configured GIF during an active preview", () => {
  const directGif = structuredClone(project);
  directGif.preview.type = "gif";
  directGif.preview.url = "/media/florent/direct-preview.gif";
  directGif.preview.fallbackGifUrl = "";

  assert.equal(
    shouldShowProjectCardGif({
      previewActive: true,
      videoUrl: "",
      gifUrl: directGif.preview.url,
      videoFailed: false,
      gifFailed: false,
    }),
    true,
  );
});

test("card and case-study media styles never scale media on hover", async () => {
  const root = postcss.parse(await readFile("app/globals.css", "utf8"));
  const forbidden: string[] = [];
  let progressAnimation = "";
  const sharedMediaGeometry: Record<string, string> = {};

  root.walkRules((rule) => {
    const targetsCardHover =
      rule.selector.includes(".project-media:hover") ||
      rule.selector.includes(".project-media:focus-within");
    const targetsCaseHover = rule.selector.includes(".case-film:hover");
    const targetsCardMedia =
      rule.selector.includes(".project-media img") ||
      rule.selector.includes(".project-media video");
    const selectors = rule.selectors.map((selector) => selector.trim());

    if (
      selectors.includes(".project-media img") &&
      selectors.includes(".project-media video")
    ) {
      rule.walkDecls((declaration) => {
        if (
          ["position", "inset", "width", "height", "object-fit"].includes(
            declaration.prop,
          )
        ) {
          sharedMediaGeometry[declaration.prop] = declaration.value;
        }
      });
    }

    rule.walkDecls((declaration) => {
      if (
        rule.selector === ".preview-progress.is-active" &&
        declaration.prop === "animation"
      ) {
        progressAnimation = declaration.value;
      }

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
  assert.equal(progressAnimation, "preview-progress 3s linear infinite");
  assert.deepEqual(sharedMediaGeometry, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    "object-fit": "cover",
  });
});
