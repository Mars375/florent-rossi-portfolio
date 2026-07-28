import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";
import { act } from "react";
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

async function renderInteractiveProjectCard(projectToRender = project) {
  const window = new Window({ url: "http://localhost" });
  const globalValues = {
    window,
    self: window,
    document: window.document,
    navigator: window.navigator,
    location: window.location,
    HTMLElement: window.HTMLElement,
    HTMLMediaElement: window.HTMLMediaElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previousGlobals = Object.fromEntries(
    Object.keys(globalValues).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );

  for (const [key, value] of Object.entries(globalValues)) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value,
      writable: true,
    });
  }
  window.matchMedia = (() =>
    ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};

  const container = window.document.createElement("div");
  window.document.body.append(container);
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container as unknown as Element);

  await act(async () => {
    root.render(
      <ProjectCard
        project={projectToRender}
        locale="fr"
        playingLabel="En lecture"
        viewLabel="Voir le projet"
      />,
    );
  });

  return {
    container,
    window,
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      for (const [key, descriptor] of Object.entries(previousGlobals)) {
        if (descriptor) {
          Object.defineProperty(globalThis, key, descriptor);
        } else {
          Reflect.deleteProperty(globalThis, key);
        }
      }
      window.close();
    },
  };
}

async function focusWithKeyboard(
  rendered: Awaited<ReturnType<typeof renderInteractiveProjectCard>>,
) {
  await act(async () => {
    rendered.window.dispatchEvent(
      new rendered.window.KeyboardEvent("keydown", { key: "Tab" }),
    );
    (
      rendered.container.querySelector(
        ".project-media-link",
      ) as unknown as HTMLAnchorElement
    ).focus();
  });
}

test("a touch pointerdown stops a preview already activated by keyboard focus", async () => {
  const rendered = await renderInteractiveProjectCard();

  try {
    assert.equal(rendered.container.querySelector("video"), null);
    await focusWithKeyboard(rendered);
    assert.equal(
      rendered.container.querySelector("video")?.classList.contains("is-visible"),
      true,
    );

    await act(async () => {
      const pointerDown = new rendered.window.Event("pointerdown");
      Object.defineProperty(pointerDown, "pointerType", { value: "touch" });
      rendered.window.dispatchEvent(pointerDown);
    });

    assert.equal(
      rendered.container.querySelector("video")?.classList.contains("is-visible"),
      false,
    );
  } finally {
    await rendered.cleanup();
  }
});

test("renders a directly configured GIF through the active project card", async () => {
  const directGif = structuredClone(project);
  directGif.preview.type = "gif";
  directGif.preview.url = "/media/florent/direct-preview.gif";
  directGif.preview.fallbackGifUrl = "";

  const rendered = await renderInteractiveProjectCard(directGif);

  try {
    assert.equal(rendered.container.querySelector("video"), null);
    assert.equal(rendered.container.querySelector(".project-preview-fallback"), null);

    await focusWithKeyboard(rendered);

    assert.equal(rendered.container.querySelector("video"), null);
    assert.equal(
      rendered.container.querySelector(".project-preview-fallback")?.getAttribute("src"),
      "/media/florent/direct-preview.gif",
    );
  } finally {
    await rendered.cleanup();
  }
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
