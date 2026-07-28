import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import type { Project } from "../content/schema";
import { ProjectView } from "../app/components/ProjectView";
import { defaultContent } from "../lib/content/fallback";
import { caseStudyGallery } from "../lib/content/case-study-media";

const afterdark = defaultContent.projects.find(
  (project) => project.id === "afterdark",
) as Project;

function renderPublicView(view: ReactNode) {
  return renderToStaticMarkup(
    <AppRouterContext.Provider value={{} as never}>
      <PathnameContext.Provider value="/fr">{view}</PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
}

function renderProjectView(project: Project) {
  return renderPublicView(
    <ProjectView
      locale="fr"
      content={defaultContent}
      project={project}
      projects={defaultContent.projects}
    />,
  );
}

test("keeps homepage preview media out of the case-study gallery", () => {
  const gallery = caseStudyGallery({
    ...afterdark,
    gallery: [
      ...afterdark.gallery,
      {
        type: "image",
        url: afterdark.preview.fallbackGifUrl,
        alt: { fr: "GIF", en: "GIF" },
        caption: { fr: "GIF", en: "GIF" },
        aspect: "wide",
      },
    ],
  });

  assert.doesNotMatch(
    gallery.map((media) => media.url).join("\n"),
    /afterdark-(loop\.mp4|preview\.gif)/,
  );
  assert.equal(gallery.length, 2);
});

test("keeps a gallery video that is distinct from the homepage preview", () => {
  const distinctVideo = {
    type: "video" as const,
    url: "/media/florent/afterdark-case-film.mp4",
    alt: { fr: "Film distinct", en: "Distinct film" },
    caption: { fr: "Film distinct", en: "Distinct film" },
    aspect: "wide" as const,
  };

  assert.deepEqual(
    caseStudyGallery({ ...afterdark, gallery: [distinctVideo] }),
    [distinctVideo],
  );
});

test("renders only distinct gallery media in the Afterdark case study", () => {
  const markup = renderProjectView(afterdark);

  assert.doesNotMatch(markup, /afterdark-loop\.mp4/);
  assert.match(markup, /Direction lumière/);
});

test("renders a single distinct gallery item in the large format", () => {
  const markup = renderProjectView({
    ...afterdark,
    gallery: [
      {
        type: "video",
        url: "/media/florent/afterdark-case-film.mp4",
        alt: { fr: "Film distinct", en: "Distinct film" },
        caption: { fr: "Film distinct", en: "Distinct film" },
        aspect: "wide",
      },
    ],
  });

  assert.match(markup, /class="visual-large"/);
  assert.match(markup, /afterdark-case-film\.mp4/);
});

test("offsets only the last item of a multi-item visual sequence", async () => {
  const root = postcss.parse(await readFile("app/globals.css", "utf8"));
  const lastChildSelectors: string[] = [];
  const mobileSelectors: string[] = [];

  root.walkRules((rule) => {
    const selectors = rule.selectors.map((selector) => selector.trim());

    if (selectors.some((selector) => selector.includes("figure:last-child"))) {
      lastChildSelectors.push(
        ...selectors.filter((selector) => selector.includes("figure:last-child")),
      );
    }

    if (
      rule.parent?.type === "atrule" &&
      rule.parent.name === "media" &&
      rule.parent.params === "(max-width: 850px)" &&
      selectors.includes(".visual-sequence figure")
    ) {
      mobileSelectors.push(...selectors);
    }
  });

  assert.deepEqual(lastChildSelectors, [
    ".visual-sequence figure:last-child:not(:first-child)",
    ".visual-sequence figure:last-child:not(:first-child)",
  ]);
  assert.deepEqual(mobileSelectors, [
    ".visual-sequence figure",
    ".visual-sequence figure:last-child:not(:first-child)",
  ]);
});
