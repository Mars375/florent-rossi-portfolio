import assert from "node:assert/strict";
import test from "node:test";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Window } from "happy-dom";
import { AboutView } from "../app/components/AboutView";
import { FooterLinks } from "../app/components/FooterLinks";
import { LegalView } from "../app/components/LegalView";
import { PortfolioHome } from "../app/components/PortfolioHome";
import { ProjectView } from "../app/components/ProjectView";
import { defaultContent } from "../lib/content/fallback";

function renderPublicView(view: ReactNode) {
  return renderToStaticMarkup(
    <AppRouterContext.Provider value={{} as never}>
      <PathnameContext.Provider value="/fr">
        {view}
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
}

test("renders editable social and localized legal links", () => {
  const markup = renderToStaticMarkup(
    <FooterLinks locale="fr" content={defaultContent} />,
  );

  assert.match(markup, /href="https:\/\/www\.linkedin\.com\/"/);
  assert.match(markup, /href="https:\/\/www\.instagram\.com\/"/);
  assert.match(markup, /href="https:\/\/vimeo\.com\/"/);
  assert.match(markup, /target="_blank"/);
  assert.match(markup, /rel="noreferrer"/);
  assert.match(markup, /href="\/fr\/legal"/);
  assert.match(markup, /href="\/fr\/privacy"/);
  assert.match(markup, /Mentions légales/);
  assert.match(markup, /Confidentialité/);
});

test("preserves a preview route base", () => {
  const markup = renderToStaticMarkup(
    <FooterLinks
      locale="en"
      content={defaultContent}
      routeBase="/admin/preview"
      compact
    />,
  );

  assert.match(markup, /href="\/admin\/preview\/en\/legal"/);
  assert.match(markup, /href="\/admin\/preview\/en\/privacy"/);
});

test("integrates social and legal links into every existing public view", () => {
  const projects = defaultContent.projects.filter(
    (project) => project.status === "published",
  );
  const views = [
    <PortfolioHome key="home" locale="fr" content={defaultContent} />,
    <AboutView key="about" locale="fr" content={defaultContent} />,
    <ProjectView
      key="project"
      locale="fr"
      content={defaultContent}
      project={projects[0]}
      projects={projects}
    />,
  ];

  for (const view of views) {
    const markup = renderPublicView(view);
    assert.match(markup, /href="https:\/\/www\.linkedin\.com\/"/);
    assert.match(markup, /href="\/fr\/legal"/);
    assert.match(markup, /href="\/fr\/privacy"/);
  }
});

test("renders one global footer landmark outside main and article on legal and project public views", () => {
  const projects = defaultContent.projects.filter(
    (project) => project.status === "published",
  );
  const views = [
    <LegalView
      key="legal"
      locale="fr"
      content={defaultContent}
      kind="legal"
    />,
    <LegalView
      key="privacy"
      locale="fr"
      content={defaultContent}
      kind="privacy"
    />,
    <ProjectView
      key="project"
      locale="fr"
      content={defaultContent}
      project={projects[0]}
      projects={projects}
    />,
  ];

  for (const view of views) {
    const document = new Window().document;
    document.body.innerHTML = renderPublicView(view);
    const footers = document.querySelectorAll("footer");

    assert.equal(footers.length, 1);
    const footer = footers[0];
    assert.ok(footer);
    assert.equal(footer.closest("main"), null);
    assert.equal(footer.closest("article"), null);
    assert.ok(footer.querySelector('a[href="/fr/legal"]'));
  }
});
