import assert from "node:assert/strict";
import test from "node:test";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
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
