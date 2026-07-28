import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import postcss from "postcss";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LegalView } from "../app/components/LegalView";
import { defaultContent } from "../lib/content/fallback";

function renderPublicView(view: ReactNode, pathname: string) {
  return renderToStaticMarkup(
    <AppRouterContext.Provider value={{} as never}>
      <PathnameContext.Provider value={pathname}>
        {view}
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
}

test("renders the French legal notice from editable content", () => {
  const markup = renderPublicView(
    <LegalView locale="fr" content={defaultContent} kind="legal" />,
    "/fr/legal",
  );

  assert.match(markup, /Mentions légales/);
  assert.match(markup, /Vercel Inc\./);
  assert.match(markup, /m\.rossiflorent@gmail\.com/);
  assert.match(markup, /Propriété intellectuelle/);
  assert.match(markup, /href="\/fr\/privacy"/);
});

test("renders the English privacy sections", () => {
  const markup = renderPublicView(
    <LegalView locale="en" content={defaultContent} kind="privacy" />,
    "/en/privacy",
  );

  assert.match(markup, /Privacy/);
  assert.match(markup, /Data controller/);
  assert.match(markup, /Cookies and local storage/);
  assert.match(markup, /External video/);
  assert.match(markup, /href="https:\/\/www\.cnil\.fr\/"/);
});

test("keeps legal section actions stable when editable labels are duplicated", () => {
  const content = structuredClone(defaultContent);
  const duplicateLabel = "Repeated label";

  for (const locale of ["fr", "en"] as const) {
    content.legal[locale].publisherLabel = duplicateLabel;
    content.legal[locale].contactLabel = duplicateLabel;
    content.legal[locale].hostLabel = duplicateLabel;
    content.legal[locale].intellectualPropertyLabel = duplicateLabel;
    content.legal[locale].externalLinksLabel = duplicateLabel;
    content.legal[locale].controllerLabel = duplicateLabel;
    content.legal[locale].dataLabel = duplicateLabel;
    content.legal[locale].purposesLabel = duplicateLabel;
    content.legal[locale].providersLabel = duplicateLabel;
    content.legal[locale].retentionLabel = duplicateLabel;
    content.legal[locale].rightsLabel = duplicateLabel;
    content.legal[locale].storageLabel = duplicateLabel;
    content.legal[locale].videosLabel = duplicateLabel;
  }

  const legalMarkup = renderPublicView(
    <LegalView locale="fr" content={content} kind="legal" />,
    "/fr/legal",
  );
  const privacyMarkup = renderPublicView(
    <LegalView locale="en" content={content} kind="privacy" />,
    "/en/privacy",
  );
  const legalSections = legalMarkup.match(
    /<div class="legal-sections">([\s\S]*?)<\/div>/,
  )?.[1];
  const privacySections = privacyMarkup.match(
    /<div class="legal-sections">([\s\S]*?)<\/div>/,
  )?.[1];

  assert.ok(legalSections);
  assert.ok(privacySections);
  assert.equal(legalSections.match(/href="mailto:/g)?.length, 1);
  assert.equal(
    legalSections.match(/href="https:\/\/vercel\.com"/g)?.length,
    1,
  );
  assert.equal(
    privacySections.match(/href="https:\/\/www\.cnil\.fr\/"/g)?.length,
    1,
  );
});

test("legal hero typography remains wrappable at 320 and 375 pixels", async () => {
  const root = postcss.parse(await readFile("app/globals.css", "utf8"));
  let fontSize = "";
  let overflowWrap = "";

  root.walkAtRules("media", (atRule) => {
    if (!atRule.params.includes("max-width: 850px")) return;

    atRule.walkRules(".legal-page h1", (rule) => {
      rule.walkDecls((declaration) => {
        if (declaration.prop === "font-size") fontSize = declaration.value;
        if (declaration.prop === "overflow-wrap") {
          overflowWrap = declaration.value;
        }
      });
    });
  });

  const clamp = fontSize.match(
    /^clamp\(([\d.]+)px,\s*([\d.]+)vw,\s*([\d.]+)px\)$/,
  );
  assert.ok(clamp, "mobile legal title must use a pixel/vw clamp");
  assert.equal(overflowWrap, "anywhere");

  const [, minimum, preferredVw, maximum] = clamp.map(Number);
  for (const viewportWidth of [320, 375]) {
    const computed = Math.min(
      Math.max(minimum, (viewportWidth * preferredVw) / 100),
      maximum,
    );
    assert.ok(
      computed <= viewportWidth * 0.18,
      `legal title is too large at ${viewportWidth}px (${computed}px)`,
    );
  }
});
