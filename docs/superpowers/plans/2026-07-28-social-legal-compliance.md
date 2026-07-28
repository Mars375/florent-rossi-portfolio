# Social Links and French Legal Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable LinkedIn/Instagram visibility, bilingual Legal and Privacy pages, and prior consent for Vimeo/YouTube while preserving the portfolio's editorial design.

**Architecture:** Extend the version-1 portfolio document with a defaulted structured `legal` object, expose it through a focused admin editor, and reuse one utility footer across every public view. Keep direct MP4 playback unchanged, but place third-party embeds behind a client-side consent view that does not create an iframe until activation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Zod 4, Supabase, Node test runner with TSX, PostCSS, Vercel.

## Global Constraints

- Treat the site as a personal, non-commercial portfolio for an employee seeking a permanent role.
- Keep `schemaVersion: 1`; older Supabase documents without `legal` must parse with complete defaults.
- All legal and social content must be editable in the existing administration UI.
- Default socials are LinkedIn, Instagram, and Vimeo with HTTPS platform-level URLs.
- Add `/fr/legal`, `/en/legal`, `/fr/privacy`, and `/en/privacy`.
- Do not add analytics, advertising trackers, a consent-management dependency, or a global cookie banner.
- Do not create a Vimeo or YouTube iframe before an explicit visitor action.
- Consent for an external video lasts only for the mounted page and is not persisted.
- Direct MP4 video continues to render immediately.
- Preserve the existing light/dark themes, keyboard focus treatment, bilingual navigation, and no-zoom media behavior.
- Use no new runtime dependency.
- Deploy code compatibility before publishing the new JSON to Supabase.

---

### Task 1: Add the defaulted legal content model

**Files:**
- Create: `content/legal.ts`
- Modify: `content/schema.ts`
- Modify: `content/default.json`
- Modify: `tests/content-schema.test.ts`

**Interfaces:**
- Produces: `legalContentSchema`, `defaultLegalContent`, `LegalContent`, and `LegalLocaleContent` from `content/legal.ts`.
- Produces: `PortfolioContent["legal"]` as a required parsed value even when raw input omits `legal`.
- Consumes: existing HTTPS URL and translated content conventions in `content/schema.ts`.

- [ ] **Step 1: Write failing schema compatibility and defaults tests**

Add these imports and tests to `tests/content-schema.test.ts`:

```ts
import { defaultLegalContent } from "../content/legal";

test("adds complete legal defaults to a legacy version-one document", () => {
  const legacy = structuredClone(content) as Record<string, unknown>;
  delete legacy.legal;

  const parsed = parsePortfolioContent(legacy);

  assert.deepEqual(parsed.legal, defaultLegalContent);
  assert.equal(parsed.schemaVersion, 1);
});

test("keeps JSON legal defaults aligned with the typed defaults", () => {
  const parsed = parsePortfolioContent(content);
  assert.deepEqual(parsed.legal, defaultLegalContent);
});

test("ships editable LinkedIn, Instagram and Vimeo defaults", () => {
  const parsed = parsePortfolioContent(content);
  assert.deepEqual(
    parsed.site.socials.map(({ label, url }) => ({ label, url })),
    [
      { label: "LinkedIn", url: "https://www.linkedin.com/" },
      { label: "Instagram", url: "https://www.instagram.com/" },
      { label: "Vimeo", url: "https://vimeo.com/" },
    ],
  );
});

test("rejects unsafe legal host URLs and malformed update dates", () => {
  const unsafeHost = structuredClone(content);
  unsafeHost.legal.host.url = "http://example.com";
  assert.throws(() => parsePortfolioContent(unsafeHost), /https/i);

  const invalidDate = structuredClone(content);
  invalidDate.legal.updatedAt = "28/07/2026";
  assert.throws(() => parsePortfolioContent(invalidDate), /date|YYYY-MM-DD/i);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/content-schema.test.ts
```

Expected: FAIL because `content/legal.ts` and the `legal` JSON field do not
exist.

- [ ] **Step 3: Create the legal schemas and exact defaults**

Create `content/legal.ts` with the explicit locale schema:

```ts
import { z } from "zod";

const requiredText = z.string().trim().min(1, "Legal copy is required");

export const legalLocaleContentSchema = z.object({
  legalTitle: requiredText,
  legalIntro: requiredText,
  publisherLabel: requiredText,
  publisherText: requiredText,
  contactLabel: requiredText,
  hostLabel: requiredText,
  intellectualPropertyLabel: requiredText,
  intellectualPropertyText: requiredText,
  externalLinksLabel: requiredText,
  externalLinksText: requiredText,
  privacyTitle: requiredText,
  privacyIntro: requiredText,
  controllerLabel: requiredText,
  controllerText: requiredText,
  dataLabel: requiredText,
  dataText: requiredText,
  purposesLabel: requiredText,
  purposesText: requiredText,
  providersLabel: requiredText,
  providersText: requiredText,
  retentionLabel: requiredText,
  retentionText: requiredText,
  rightsLabel: requiredText,
  rightsText: requiredText,
  storageLabel: requiredText,
  storageText: requiredText,
  videosLabel: requiredText,
  videosText: requiredText,
  loadVideo: requiredText,
  externalVideoNotice: requiredText,
  footerLegal: requiredText,
  footerPrivacy: requiredText,
  updatedLabel: requiredText,
});

export const legalContentSchema = z.object({
  updatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD"),
  host: z.object({
    name: requiredText,
    address: requiredText,
    url: z
      .string()
      .url()
      .refine((value) => new URL(value).protocol === "https:", {
        message: "Host URL must use HTTPS",
      }),
  }),
  fr: legalLocaleContentSchema,
  en: legalLocaleContentSchema,
});

export type LegalContent = z.infer<typeof legalContentSchema>;
export type LegalLocaleContent = z.infer<typeof legalLocaleContentSchema>;
```

Append the following exact object and parse it through the schema:

```ts
export const defaultLegalContent = legalContentSchema.parse({
  updatedAt: "2026-07-28",
  host: {
    name: "Vercel Inc.",
    address:
      "440 N Barranca Avenue #4133, Covina, CA 91723, United States",
    url: "https://vercel.com",
  },
  fr: {
    legalTitle: "Mentions légales",
    legalIntro:
      "Ce site est le portfolio personnel et non professionnel de Florent Rossi.",
    publisherLabel: "Édition",
    publisherText:
      "Florent Rossi assure la publication de ce portfolio personnel.",
    contactLabel: "Contact",
    hostLabel: "Hébergement",
    intellectualPropertyLabel: "Propriété intellectuelle",
    intellectualPropertyText:
      "Les textes, images, films, identités et créations présentés restent protégés par les droits de leurs auteurs et ayants droit. Toute reproduction ou réutilisation nécessite leur autorisation préalable.",
    externalLinksLabel: "Liens externes",
    externalLinksText:
      "Les liens externes sont fournis à titre informatif. Florent Rossi ne contrôle pas leur disponibilité ni leur contenu.",
    privacyTitle: "Confidentialité",
    privacyIntro:
      "Cette page explique les données susceptibles d’être traitées lors de l’utilisation du portfolio.",
    controllerLabel: "Responsable du traitement",
    controllerText:
      "Florent Rossi est responsable des données reçues directement par l’intermédiaire de son adresse e-mail.",
    dataLabel: "Données concernées",
    dataText:
      "Aucun compte public ni formulaire de contact n’est proposé. Un visiteur peut transmettre volontairement son identité, ses coordonnées et son message par e-mail. L’hébergement peut produire des journaux techniques nécessaires à la sécurité du service.",
    purposesLabel: "Finalités et bases légales",
    purposesText:
      "Les données servent à lire et répondre aux échanges professionnels, sur la base de l’intérêt légitime ou de mesures précontractuelles, ainsi qu’à sécuriser et exploiter le site sur la base de l’intérêt légitime.",
    providersLabel: "Prestataires",
    providersText:
      "Vercel assure l’hébergement, Supabase le contenu et l’administration privée, le fournisseur de messagerie traite les e-mails, et Vimeo ou YouTube interviennent uniquement après consentement pour lire une vidéo externe.",
    retentionLabel: "Conservation",
    retentionText:
      "Les échanges professionnels sont conservés le temps nécessaire et au maximum trois ans après le dernier échange actif, sauf obligation légale ou litige. Les journaux techniques suivent les durées du prestataire, les sessions administrateur expirent ou prennent fin à la déconnexion, et la préférence de thème reste dans le navigateur jusqu’à sa modification ou suppression.",
    rightsLabel: "Vos droits",
    rightsText:
      "Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, l’opposition ou la portabilité lorsqu’elle s’applique. Vous pouvez également saisir la CNIL sur cnil.fr.",
    storageLabel: "Cookies et stockage local",
    storageText:
      "Le portfolio public n’utilise ni publicité ni mesure d’audience. Seul le choix clair ou sombre est conservé localement. Les cookies d’authentification strictement nécessaires sont réservés à l’administration privée.",
    videosLabel: "Vidéos externes",
    videosText:
      "Vimeo et YouTube ne sont pas contactés avant l’activation volontaire du lecteur. Le consentement n’est conservé que pendant l’affichage de la page.",
    loadVideo: "Charger la vidéo",
    externalVideoNotice:
      "Cette vidéo est hébergée par un service externe. Son chargement autorise une connexion à ce service.",
    footerLegal: "Mentions légales",
    footerPrivacy: "Confidentialité",
    updatedLabel: "Dernière mise à jour",
  },
  en: {
    legalTitle: "Legal notice",
    legalIntro:
      "This website is Florent Rossi’s personal, non-commercial portfolio.",
    publisherLabel: "Publisher",
    publisherText:
      "Florent Rossi publishes this personal portfolio.",
    contactLabel: "Contact",
    hostLabel: "Hosting",
    intellectualPropertyLabel: "Intellectual property",
    intellectualPropertyText:
      "The text, images, films, identities and creative work remain protected by the rights of their respective authors and rights holders. Reproduction or reuse requires their prior authorization.",
    externalLinksLabel: "External links",
    externalLinksText:
      "External links are provided for information. Florent Rossi does not control their continuing availability or content.",
    privacyTitle: "Privacy",
    privacyIntro:
      "This page explains the data that may be processed when the portfolio is used.",
    controllerLabel: "Data controller",
    controllerText:
      "Florent Rossi controls personal data received directly through his e-mail address.",
    dataLabel: "Data concerned",
    dataText:
      "No public account or contact form is provided. A visitor may voluntarily send their identity, contact details and message by e-mail. Hosting may produce technical logs required to secure the service.",
    purposesLabel: "Purposes and legal bases",
    purposesText:
      "Data is used to read and answer professional enquiries on the basis of legitimate interests or pre-contractual steps, and to secure and operate the site on the basis of legitimate interests.",
    providersLabel: "Providers",
    providersText:
      "Vercel provides hosting, Supabase provides content and private administration, the configured mail provider processes e-mail, and Vimeo or YouTube is contacted only after consent to play an external video.",
    retentionLabel: "Retention",
    retentionText:
      "Professional correspondence is kept only as needed and for no longer than three years after the last active exchange unless a legal obligation or dispute requires longer. Technical logs follow provider retention periods, admin sessions expire or end on sign-out, and the theme preference remains in the browser until changed or cleared.",
    rightsLabel: "Your rights",
    rightsText:
      "You may request access, rectification, erasure, restriction, objection or portability where applicable. You may also lodge a complaint with the French CNIL at cnil.fr.",
    storageLabel: "Cookies and local storage",
    storageText:
      "The public portfolio uses neither advertising nor audience measurement. Only the light or dark preference is stored locally. Strictly necessary authentication cookies are limited to the private administration area.",
    videosLabel: "External video",
    videosText:
      "Vimeo and YouTube are not contacted before the player is deliberately activated. Consent lasts only while the page is mounted.",
    loadVideo: "Load video",
    externalVideoNotice:
      "This video is hosted by an external service. Loading it authorizes a connection to that service.",
    footerLegal: "Legal notice",
    footerPrivacy: "Privacy",
    updatedLabel: "Last updated",
  },
});
```

- [ ] **Step 4: Integrate the default into the portfolio schema**

In `content/schema.ts`, import the legal module and add the defaulted field:

```ts
import {
  defaultLegalContent,
  legalContentSchema,
} from "./legal";

// Inside portfolioContentSchema:
legal: legalContentSchema.default(defaultLegalContent),
```

Keep `schemaVersion: z.literal(1)`.

- [ ] **Step 5: Add the same defaults to the checked-in JSON**

In `content/default.json`:

- replace the social list with LinkedIn, Instagram, and Vimeo in that order;
- add the exact `defaultLegalContent` value from Step 3 as top-level `legal`;
- keep all project media and preview URLs unchanged.

- [ ] **Step 6: Run the focused schema test**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/content-schema.test.ts
```

Expected: all content-schema tests PASS.

- [ ] **Step 7: Commit the content model**

```powershell
git add content/legal.ts content/schema.ts content/default.json tests/content-schema.test.ts
git commit -m "feat: add editable legal content model"
```

---

### Task 2: Add the Legal administration tab

**Files:**
- Create: `app/admin/components/LegalEditor.tsx`
- Create: `tests/legal-editor.test.tsx`
- Modify: `app/admin/AdminEditor.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `LegalContent` and `LegalLocaleContent` from `content/legal.ts`.
- Produces: `LegalEditor({ value, onChange })`.
- `onChange` receives a complete, immutable `LegalContent` replacement.

- [ ] **Step 1: Write the failing LegalEditor rendering test**

Create `tests/legal-editor.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/legal-editor.test.tsx
```

Expected: FAIL because `LegalEditor` does not exist.

- [ ] **Step 3: Implement the focused LegalEditor component**

Create `app/admin/components/LegalEditor.tsx`:

```tsx
"use client";

import type {
  LegalContent,
  LegalLocaleContent,
} from "../../../content/legal";

const localeFields: Array<keyof LegalLocaleContent> = [
  "legalTitle",
  "legalIntro",
  "publisherLabel",
  "publisherText",
  "contactLabel",
  "hostLabel",
  "intellectualPropertyLabel",
  "intellectualPropertyText",
  "externalLinksLabel",
  "externalLinksText",
  "privacyTitle",
  "privacyIntro",
  "controllerLabel",
  "controllerText",
  "dataLabel",
  "dataText",
  "purposesLabel",
  "purposesText",
  "providersLabel",
  "providersText",
  "retentionLabel",
  "retentionText",
  "rightsLabel",
  "rightsText",
  "storageLabel",
  "storageText",
  "videosLabel",
  "videosText",
  "loadVideo",
  "externalVideoNotice",
  "footerLegal",
  "footerPrivacy",
  "updatedLabel",
];

export function LegalEditor({
  value,
  onChange,
}: {
  value: LegalContent;
  onChange: (value: LegalContent) => void;
}) {
  const edit = (mutate: (draft: LegalContent) => void) => {
    const draft = structuredClone(value);
    mutate(draft);
    onChange(draft);
  };

  return (
    <div className="admin-panel legal-editor">
      <section className="admin-form-section">
        <h2>Informations partagées</h2>
        <label>
          Dernière mise à jour
          <input
            type="date"
            value={value.updatedAt}
            onChange={(event) =>
              edit((draft) => {
                draft.updatedAt = event.target.value;
              })
            }
          />
        </label>
        <label>
          Hébergeur
          <input
            value={value.host.name}
            onChange={(event) =>
              edit((draft) => {
                draft.host.name = event.target.value;
              })
            }
          />
        </label>
        <label>
          Adresse de l’hébergeur
          <textarea
            value={value.host.address}
            onChange={(event) =>
              edit((draft) => {
                draft.host.address = event.target.value;
              })
            }
          />
        </label>
        <label>
          URL de l’hébergeur
          <input
            type="url"
            value={value.host.url}
            onChange={(event) =>
              edit((draft) => {
                draft.host.url = event.target.value;
              })
            }
          />
        </label>
      </section>

      {(["fr", "en"] as const).map((locale) => (
        <section className="admin-form-section" key={locale}>
          <h2>{locale === "fr" ? "Français" : "English"}</h2>
          {localeFields.map((field) => (
            <label key={field}>
              {field}
              <textarea
                rows={field.endsWith("Text") ? 5 : 2}
                value={value[locale][field]}
                onChange={(event) =>
                  edit((draft) => {
                    draft[locale][field] = event.target.value;
                  })
                }
              />
            </label>
          ))}
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Wire the new tab into AdminEditor**

In `app/admin/AdminEditor.tsx`:

```tsx
import { LegalEditor } from "./components/LegalEditor";

type Tab = "site" | "home" | "about" | "projects" | "legal";

const tabLabels: Record<Tab, string> = {
  site: "Site",
  home: "Accueil",
  about: "À propos",
  projects: "Projets",
  legal: "Légal",
};
```

Render the tab body:

```tsx
{tab === "legal" ? (
  <LegalEditor
    value={content.legal}
    onChange={(value) =>
      edit((draft) => {
        draft.legal = value;
      })
    }
  />
) : null}
```

Do not change the existing social add/remove editor in the Site tab.

- [ ] **Step 5: Add narrow admin styling**

Add to `app/globals.css`:

```css
.legal-editor .admin-form-section {
  max-width: 1040px;
}

.legal-editor textarea {
  min-height: 76px;
}
```

- [ ] **Step 6: Run the focused tests**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/legal-editor.test.tsx tests/admin-actions.test.ts
```

Expected: all tests PASS.

- [ ] **Step 7: Commit the admin editor**

```powershell
git add app/admin/AdminEditor.tsx app/admin/components/LegalEditor.tsx app/globals.css tests/legal-editor.test.tsx
git commit -m "feat: edit legal content in admin"
```

---

### Task 3: Add reusable social and legal footer links

**Files:**
- Create: `app/components/FooterLinks.tsx`
- Create: `tests/footer-links.test.tsx`
- Modify: `app/components/PortfolioHome.tsx`
- Modify: `app/components/AboutView.tsx`
- Modify: `app/components/ProjectView.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `FooterLinks({ locale, content, routeBase?, compact? })`.
- Consumes: `PortfolioContent["site"]["socials"]` and `PortfolioContent["legal"]`.
- Later Legal and Privacy views reuse the same component.

- [ ] **Step 1: Write the failing footer component test**

Create `tests/footer-links.test.tsx`:

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AboutView } from "../app/components/AboutView";
import { FooterLinks } from "../app/components/FooterLinks";
import { PortfolioHome } from "../app/components/PortfolioHome";
import { ProjectView } from "../app/components/ProjectView";
import { defaultContent } from "../lib/content/fallback";

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
    <PortfolioHome locale="fr" content={defaultContent} />,
    <AboutView locale="fr" content={defaultContent} />,
    <ProjectView
      locale="fr"
      content={defaultContent}
      project={projects[0]}
      projects={projects}
    />,
  ];

  for (const view of views) {
    const markup = renderToStaticMarkup(view);
    assert.match(markup, /href="https:\/\/www\.linkedin\.com\/"/);
    assert.match(markup, /href="\/fr\/legal"/);
    assert.match(markup, /href="\/fr\/privacy"/);
  }
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/footer-links.test.tsx
```

Expected: FAIL because `FooterLinks` does not exist.

- [ ] **Step 3: Implement FooterLinks**

Create `app/components/FooterLinks.tsx`:

```tsx
import Link from "next/link";
import type { Locale, PortfolioContent } from "../../content/schema";

export function FooterLinks({
  locale,
  content,
  routeBase = "",
  compact = false,
}: {
  locale: Locale;
  content: PortfolioContent;
  routeBase?: string;
  compact?: boolean;
}) {
  const copy = content.legal[locale];
  return (
    <div className={`utility-footer ${compact ? "is-compact" : ""}`}>
      <span>{content.site.location[locale]}</span>
      <nav aria-label={locale === "fr" ? "Réseaux sociaux" : "Social media"}>
        {content.site.socials.map((social) => (
          <a
            className="nav-link focus-ring"
            href={social.url}
            key={`${social.label}-${social.url}`}
            target="_blank"
            rel="noreferrer"
          >
            {social.label}
          </a>
        ))}
      </nav>
      <nav aria-label={locale === "fr" ? "Informations légales" : "Legal information"}>
        <Link className="nav-link focus-ring" href={`${routeBase}/${locale}/legal`}>
          {copy.footerLegal}
        </Link>
        <Link className="nav-link focus-ring" href={`${routeBase}/${locale}/privacy`}>
          {copy.footerPrivacy}
        </Link>
      </nav>
      <span>{content.site.copyright}</span>
    </div>
  );
}
```

- [ ] **Step 4: Integrate it into every existing public view**

In `PortfolioHome.tsx`, replace the entire legacy `.footer-meta` block with:

```tsx
<FooterLinks locale={locale} content={content} routeBase={routeBase} />
```

In `AboutView.tsx`, replace the entire hand-written bottom metadata `<div>` with
the same `FooterLinks`. The component preserves the localized location in both
views.

In `ProjectView.tsx`, render after `.project-nav`:

```tsx
<FooterLinks
  locale={locale}
  content={content}
  routeBase={routeBase}
  compact
/>
```

- [ ] **Step 5: Style the utility footer**

Add these rules to `app/globals.css` and adapt the existing footer media rule so
the new unit stacks below 850px:

```css
.utility-footer {
  display: grid;
  grid-template-columns: auto minmax(180px, 1fr) auto auto;
  gap: 30px;
  align-items: end;
  width: 100%;
  padding-top: 28px;
  border-top: 1px solid currentColor;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.utility-footer nav {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.utility-footer nav:nth-of-type(2) {
  justify-content: end;
}

.utility-footer.is-compact {
  width: min(100% - 48px, 1540px);
  margin: 100px auto 0;
  padding-bottom: 30px;
}

.giant-footer > .utility-footer,
.contact-footer > .utility-footer {
  margin-top: 110px;
}

@media (max-width: 850px) {
  .utility-footer,
  .utility-footer.is-compact {
    grid-template-columns: 1fr;
    width: min(100% - 28px, 720px);
  }

  .utility-footer nav:nth-of-type(2) {
    justify-content: start;
  }
}
```

Remove the legacy `.footer-meta, .contact-footer > div` rule and its mobile
counterpart because those selectors otherwise override the reusable component.

- [ ] **Step 6: Run the focused footer test**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/footer-links.test.tsx
```

Expected: all footer tests PASS.

- [ ] **Step 7: Commit the shared footer**

```powershell
git add app/components/FooterLinks.tsx app/components/PortfolioHome.tsx app/components/AboutView.tsx app/components/ProjectView.tsx app/globals.css tests/footer-links.test.tsx
git commit -m "feat: expose social and legal footer links"
```

---

### Task 4: Add bilingual Legal and Privacy routes

**Files:**
- Create: `app/components/LegalView.tsx`
- Create: `app/[locale]/legal/page.tsx`
- Create: `app/[locale]/privacy/page.tsx`
- Create: `app/admin/(protected)/preview/[locale]/legal/page.tsx`
- Create: `app/admin/(protected)/preview/[locale]/privacy/page.tsx`
- Create: `tests/legal-pages.test.tsx`
- Modify: `tests/site-url.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `LegalView({ locale, content, kind, routeBase? })`, where `kind` is
  `"legal" | "privacy"`.
- Consumes: `FooterLinks`, `SiteHeader`, and localized legal content.
- Produces: exact canonical and language alternates for `/legal` and `/privacy`.

- [ ] **Step 1: Write failing view and metadata tests**

Create `tests/legal-pages.test.tsx`:

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LegalView } from "../app/components/LegalView";
import { defaultContent } from "../lib/content/fallback";

test("renders the French legal notice from editable content", () => {
  const markup = renderToStaticMarkup(
    <LegalView locale="fr" content={defaultContent} kind="legal" />,
  );

  assert.match(markup, /Mentions légales/);
  assert.match(markup, /Vercel Inc\./);
  assert.match(markup, /m\.rossiflorent@gmail\.com/);
  assert.match(markup, /Propriété intellectuelle/);
  assert.match(markup, /href="\/fr\/privacy"/);
});

test("renders the English privacy sections", () => {
  const markup = renderToStaticMarkup(
    <LegalView locale="en" content={defaultContent} kind="privacy" />,
  );

  assert.match(markup, /Privacy/);
  assert.match(markup, /Data controller/);
  assert.match(markup, /Cookies and local storage/);
  assert.match(markup, /External video/);
  assert.match(markup, /href="https:\/\/www\.cnil\.fr\/"/);
});
```

Extend `tests/site-url.test.ts`:

```ts
import { generateMetadata as generateLegalMetadata } from "../app/[locale]/legal/page";
import { generateMetadata as generatePrivacyMetadata } from "../app/[locale]/privacy/page";

test("legal routes publish exact localized canonical alternates", async () => {
  const [legal, privacy] = await Promise.all([
    generateLegalMetadata({ params: Promise.resolve({ locale: "fr" }) }),
    generatePrivacyMetadata({ params: Promise.resolve({ locale: "en" }) }),
  ]);

  assert.equal(
    href(legal.alternates?.canonical),
    "https://florentrossi.fr/fr/legal",
  );
  assert.equal(
    href(legal.alternates?.languages?.en),
    "https://florentrossi.fr/en/legal",
  );
  assert.equal(
    href(privacy.alternates?.canonical),
    "https://florentrossi.fr/en/privacy",
  );
  assert.equal(
    href(privacy.alternates?.languages?.fr),
    "https://florentrossi.fr/fr/privacy",
  );
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/legal-pages.test.tsx tests/site-url.test.ts
```

Expected: FAIL because the component and routes do not exist.

- [ ] **Step 3: Implement the structured LegalView**

Create `app/components/LegalView.tsx` with:

```tsx
import type { Locale, PortfolioContent } from "../../content/schema";
import { FooterLinks } from "./FooterLinks";
import { SiteHeader } from "./SiteHeader";

export function LegalView({
  locale,
  content,
  kind,
  routeBase = "",
}: {
  locale: Locale;
  content: PortfolioContent;
  kind: "legal" | "privacy";
  routeBase?: string;
}) {
  const copy = content.legal[locale];
  const sections =
    kind === "legal"
      ? [
          [copy.publisherLabel, copy.publisherText],
          [copy.contactLabel, content.site.email],
          [
            copy.hostLabel,
            `${content.legal.host.name}\n${content.legal.host.address}`,
          ],
          [copy.intellectualPropertyLabel, copy.intellectualPropertyText],
          [copy.externalLinksLabel, copy.externalLinksText],
        ]
      : [
          [copy.controllerLabel, copy.controllerText],
          [copy.dataLabel, copy.dataText],
          [copy.purposesLabel, copy.purposesText],
          [copy.providersLabel, copy.providersText],
          [copy.retentionLabel, copy.retentionText],
          [copy.rightsLabel, copy.rightsText],
          [copy.storageLabel, copy.storageText],
          [copy.videosLabel, copy.videosText],
        ];

  return (
    <main>
      <SiteHeader locale={locale} content={content} routeBase={routeBase} />
      <article className="legal-page shell">
        <header>
          <p className="section-label">
            {kind === "legal" ? "01" : "02"} / Florent Rossi
          </p>
          <h1>{kind === "legal" ? copy.legalTitle : copy.privacyTitle}</h1>
          <p>{kind === "legal" ? copy.legalIntro : copy.privacyIntro}</p>
        </header>
        <div className="legal-sections">
          {sections.map(([title, text], index) => (
            <section key={title}>
              <p className="section-label">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2>{title}</h2>
              {title === copy.contactLabel ? (
                <a href={`mailto:${content.site.email}`}>{text}</a>
              ) : (
                <p>{text}</p>
              )}
              {title === copy.hostLabel ? (
                <a href={content.legal.host.url}>{content.legal.host.url}</a>
              ) : null}
              {title === copy.rightsLabel ? (
                <a href="https://www.cnil.fr/">https://www.cnil.fr/</a>
              ) : null}
            </section>
          ))}
        </div>
        <p className="legal-updated">
          {copy.updatedLabel}: {content.legal.updatedAt}
        </p>
      </article>
      <FooterLinks
        locale={locale}
        content={content}
        routeBase={routeBase}
        compact
      />
    </main>
  );
}
```

Preserve line breaks in the hosting address with CSS `white-space: pre-line`.

- [ ] **Step 4: Implement both route modules**

Use this exact pattern in `app/[locale]/legal/page.tsx`, with title and suffix
`/legal`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalView } from "../../components/LegalView";
import { isLocale } from "../../../lib/content/locales";
import { getPublishedContent } from "../../../lib/content/repository";
import { localizedAlternates } from "../../../lib/site-url";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolved = locale === "fr" ? "fr" : "en";
  return {
    title: resolved === "fr" ? "Mentions légales" : "Legal notice",
    alternates: localizedAlternates(resolved, "/legal"),
  };
}

export default async function LegalPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <LegalView
      locale={locale}
      content={await getPublishedContent()}
      kind="legal"
    />
  );
}
```

Create `app/[locale]/privacy/page.tsx` with the same imports and validation,
using:

```tsx
title: resolved === "fr" ? "Confidentialité" : "Privacy",
alternates: localizedAlternates(resolved, "/privacy"),
```

and render `kind="privacy"`.

- [ ] **Step 5: Add legal-page styling**

Before styling, create both protected preview routes. Follow the existing
About-preview pattern exactly. The Legal preview renders:

```tsx
import { notFound } from "next/navigation";
import { LegalView } from "../../../../../components/LegalView";
import { isLocale } from "../../../../../../lib/content/locales";
import { getDraftContent } from "../../../../../../lib/content/repository";

export const dynamic = "force-dynamic";

export default async function AdminLegalPreview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="admin-preview">
      <div className="admin-preview-banner">
        Aperçu privé du brouillon — rien ici n’est encore publié
      </div>
      <LegalView
        locale={locale}
        content={await getDraftContent()}
        kind="legal"
        routeBase="/admin/preview"
      />
    </div>
  );
}
```

Create the Privacy preview with the same imports, banner, and route base, using
component name `AdminPrivacyPreview` and `kind="privacy"`.

Then add legal-page styling.

Add to `app/globals.css`:

```css
.legal-page {
  padding: clamp(70px, 9vw, 150px) 0 40px;
}

.legal-page header {
  max-width: 1180px;
}

.legal-page h1 {
  margin: 32px 0;
  font-family: var(--serif);
  font-size: clamp(76px, 13vw, 190px);
  font-weight: 500;
  letter-spacing: -0.07em;
  line-height: 0.82;
}

.legal-page header > p:last-child {
  max-width: 760px;
  font-size: clamp(20px, 2.4vw, 34px);
}

.legal-sections {
  max-width: 980px;
  margin: clamp(90px, 12vw, 180px) 0 0 auto;
}

.legal-sections section {
  display: grid;
  grid-template-columns: 70px minmax(180px, 0.8fr) minmax(0, 1.7fr);
  gap: 24px;
  padding: 30px 0;
  border-top: 1px solid var(--line);
}

.legal-sections h2,
.legal-sections p {
  margin: 0;
}

.legal-sections h2 {
  font-family: var(--serif);
  font-size: clamp(28px, 3vw, 46px);
}

.legal-sections p {
  white-space: pre-line;
}

.legal-sections a {
  grid-column: 3;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.legal-updated {
  margin-top: 70px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 850px) {
  .legal-sections section {
    grid-template-columns: 36px 1fr;
  }

  .legal-sections section > p:not(.section-label),
  .legal-sections section > a {
    grid-column: 2;
  }
}
```

- [ ] **Step 6: Run the focused page and metadata tests**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/legal-pages.test.tsx tests/site-url.test.ts
```

Expected: all legal-view and metadata tests PASS.

- [ ] **Step 7: Commit the public legal pages**

```powershell
git add app/components/LegalView.tsx app/[locale]/legal/page.tsx app/[locale]/privacy/page.tsx "app/admin/(protected)/preview/[locale]/legal/page.tsx" "app/admin/(protected)/preview/[locale]/privacy/page.tsx" app/globals.css tests/legal-pages.test.tsx tests/site-url.test.ts
git commit -m "feat: add bilingual legal and privacy pages"
```

---

### Task 5: Gate Vimeo and YouTube behind explicit consent

**Files:**
- Create: `app/components/ExternalVideoConsent.tsx`
- Create: `tests/video-consent.test.tsx`
- Modify: `app/components/VideoEmbed.tsx`
- Modify: `app/components/ProjectView.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `ExternalVideoConsent` stateful wrapper.
- Produces: `ExternalVideoConsentView` pure testable renderer with explicit
  `consented` and `onConsent`.
- `VideoEmbed` receives `consentCopy: Pick<LegalLocaleContent, "loadVideo" | "externalVideoNotice">`.
- Consumes: already parsed secure Vimeo/YouTube embed URLs.

- [ ] **Step 1: Write failing no-iframe, consented-iframe, and MP4 tests**

Create `tests/video-consent.test.tsx`:

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ExternalVideoConsentView } from "../app/components/ExternalVideoConsent";
import { VideoEmbed } from "../app/components/VideoEmbed";
import { defaultContent } from "../lib/content/fallback";

const externalProject = defaultContent.projects[0];
const consentCopy = defaultContent.legal.fr;

test("does not contact an external video provider before consent", () => {
  const markup = renderToStaticMarkup(
    <VideoEmbed
      project={externalProject}
      locale="fr"
      consentCopy={consentCopy}
    />,
  );

  assert.doesNotMatch(markup, /<iframe/);
  assert.doesNotMatch(markup, /player\.vimeo\.com/);
  assert.match(markup, /Charger la vidéo/);
  assert.match(markup, /afterdark-poster\.jpg/);
});

test("renders the sandboxed iframe only in the consented view", () => {
  const markup = renderToStaticMarkup(
    <ExternalVideoConsentView
      consented
      embedUrl="https://player.vimeo.com/video/76979871"
      notice="External service"
      buttonLabel="Load video"
      provider="Vimeo"
      posterUrl="/media/florent/afterdark-poster.jpg"
      title="Afterdark"
      onConsent={() => undefined}
    />,
  );

  assert.match(markup, /<iframe/);
  assert.match(markup, /player\.vimeo\.com\/video\/76979871/);
  assert.match(markup, /sandbox="allow-scripts allow-same-origin allow-presentation"/);
});

test("keeps direct MP4 playback immediate", () => {
  const directProject = structuredClone(externalProject);
  directProject.fullVideo = {
    provider: "mp4",
    url: "https://example.com/film.mp4",
  };

  const markup = renderToStaticMarkup(
    <VideoEmbed
      project={directProject}
      locale="en"
      consentCopy={defaultContent.legal.en}
    />,
  );

  assert.match(markup, /<video/);
  assert.match(markup, /src="https:\/\/example\.com\/film\.mp4"/);
  assert.doesNotMatch(markup, /Load video/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/video-consent.test.tsx
```

Expected: FAIL because external embeds still render immediately and the consent
component does not exist.

- [ ] **Step 3: Implement the pure view and stateful wrapper**

Create `app/components/ExternalVideoConsent.tsx`:

```tsx
"use client";

import { useState } from "react";

type Props = {
  embedUrl: string;
  notice: string;
  buttonLabel: string;
  provider: string;
  posterUrl: string;
  title: string;
};

export function ExternalVideoConsentView({
  consented,
  onConsent,
  embedUrl,
  notice,
  buttonLabel,
  provider,
  posterUrl,
  title,
}: Props & {
  consented: boolean;
  onConsent: () => void;
}) {
  if (consented) {
    return (
      <iframe
        className="full-video"
        src={embedUrl}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    );
  }

  return (
    <div className="full-video external-video-consent">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={posterUrl} alt="" />
      <div>
        <p>{notice}</p>
        <button type="button" className="email-link focus-ring" onClick={onConsent}>
          {buttonLabel} — {provider}
        </button>
      </div>
    </div>
  );
}

export function ExternalVideoConsent(props: Props) {
  const [consented, setConsented] = useState(false);
  return (
    <ExternalVideoConsentView
      {...props}
      consented={consented}
      onConsent={() => setConsented(true)}
    />
  );
}
```

- [ ] **Step 4: Use the consent wrapper for parsed embeds**

In `VideoEmbed.tsx`:

- import `LegalLocaleContent`;
- add the required `consentCopy` prop;
- leave the direct `<video>` branch unchanged;
- replace the external `<iframe>` branch with:

```tsx
<ExternalVideoConsent
  embedUrl={source.src}
  notice={consentCopy.externalVideoNotice}
  buttonLabel={consentCopy.loadVideo}
  provider={project.fullVideo.provider === "vimeo" ? "Vimeo" : "YouTube"}
  posterUrl={project.posterUrl}
  title={title}
/>
```

In `ProjectView.tsx`, pass:

```tsx
<VideoEmbed
  project={project}
  locale={locale}
  consentCopy={content.legal[locale]}
/>
```

Keep the existing `.film-play` label only for direct MP4 projects:

```tsx
{project.fullVideo.provider === "mp4" ? (
  <span className="film-play">▶ {labels.playFilm}</span>
) : null}
```

The external consent component is the only call to action for Vimeo and
YouTube.

- [ ] **Step 5: Style the consent poster without zoom**

Add:

```css
.external-video-consent {
  position: relative;
  min-height: min(82vh, 980px);
}

.external-video-consent img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.75) brightness(0.55);
}

.external-video-consent > div {
  position: absolute;
  inset: auto 32px 32px;
  max-width: 620px;
  color: #fff;
}

.external-video-consent button {
  margin-top: 18px;
  border: 0;
}

@media (max-width: 850px) {
  .external-video-consent {
    min-height: 68svh;
  }

  .external-video-consent > div {
    inset: auto 18px 18px;
  }
}
```

Do not add a `transform`, scale transition, autoplay, or persistence.

- [ ] **Step 6: Run focused video tests**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/video-consent.test.tsx tests/video.test.ts
```

Expected: all consent and URL parsing tests PASS.

- [ ] **Step 7: Commit video consent**

```powershell
git add app/components/ExternalVideoConsent.tsx app/components/VideoEmbed.tsx app/components/ProjectView.tsx app/globals.css tests/video-consent.test.tsx
git commit -m "feat: require consent for external videos"
```

---

### Task 6: Update client documentation and run complete validation

**Files:**
- Modify: `docs/client-editor-guide.md`
- Modify if verification exposes defects: only files already owned by Tasks 1–5

**Interfaces:**
- Documents: social editing, Legal tab, legal-status caveat, and external-video behavior.
- Verifies: all previously produced interfaces together.

- [ ] **Step 1: Document the new editing workflow**

Add these exact sections to `docs/client-editor-guide.md`:

```md
## Réseaux sociaux

Dans **Site → Réseaux**, remplacez les URL génériques de LinkedIn, Instagram et
Vimeo par les profils définitifs. Vous pouvez ajouter ou retirer un réseau.
Toutes les URL doivent commencer par `https://`.

## Mentions légales et confidentialité

L’onglet **Légal** contrôle les pages françaises et anglaises, l’hébergeur et la
date de mise à jour. Le texte fourni correspond à un portfolio personnel non
marchand. Faites réviser ces pages si Florent commence à vendre des prestations,
crée une entreprise, ajoute un formulaire, des statistiques d’audience, de la
publicité ou un nouvel outil tiers.

## Vidéos Vimeo et YouTube

Une vidéo externe reste derrière son affiche jusqu’au clic du visiteur sur
« Charger la vidéo ». Une vidéo MP4 directe reste disponible immédiatement.
```

- [ ] **Step 2: Run the entire test suite**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test "tests/**/*.test.ts" "tests/**/*.test.tsx"
```

Expected: zero failures and the total includes every `.ts` and `.tsx` test.

- [ ] **Step 3: Run lint**

Run:

```powershell
node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next
```

Expected: exit code 0 with no errors.

- [ ] **Step 4: Run TypeScript**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 5: Run the production build**

Run:

```powershell
node node_modules/next/dist/bin/next build
```

Expected: optimized build succeeds and route output includes:

```text
/[locale]/legal
/[locale]/privacy
/admin/preview/[locale]/legal
/admin/preview/[locale]/privacy
```

- [ ] **Step 6: Run local browser verification**

Start the production build on an unused local port and verify:

1. `/fr`, `/en`, `/fr/about`, a French case study, `/fr/legal`, and
   `/en/privacy` render without console errors.
2. LinkedIn, Instagram, Vimeo, Legal, and Privacy links are visible and keyboard
   reachable.
3. Light and dark modes both style the footer and legal pages correctly.
4. The network panel contains no `player.vimeo.com` or
   `youtube-nocookie.com` request before the external-video button is pressed.
5. Keyboard activation of the button creates exactly one sandboxed iframe.
6. A mobile viewport stacks the utility footer and legal sections without
   horizontal overflow.

- [ ] **Step 7: Commit documentation and any verified integration corrections**

```powershell
git add docs/client-editor-guide.md
git commit -m "docs: explain social and legal editing"
```

If validation required a correction, stage its exact owned file and test in the
same commit only when the correction is part of the documented integration.

---

### Task 7: Deploy safely and upgrade Supabase content

**Files:**
- No source files unless production verification reveals a reproducible defect.
- Remote data: `public.portfolio_documents` keys `draft` and `published`.

**Interfaces:**
- Consumes: a clean verified `main` commit and `content/default.json`.
- Produces: deployed compatible code before remote JSON upgrade.

- [ ] **Step 1: Finish the branch through the standard integration workflow**

Use `superpowers:finishing-a-development-branch`. Do not infer merge or PR
choice. Execute the user's selected option and rerun the complete test suite on
the merged result when merging locally.

- [ ] **Step 2: Push the verified integration commit**

Push the chosen branch through the approved GitHub workflow. Never force-push.

- [ ] **Step 3: Verify code deployment before changing Supabase**

On the Vercel production URL, verify:

- HTTP 200 for `/fr/legal` and `/en/privacy`;
- page HTML contains the theme bootstrap;
- the new legal routes use `https://florentrossi.fr` canonicals;
- an old Supabase document without `legal` still renders using defaults.

- [ ] **Step 4: Atomically synchronize both portfolio documents**

Read `content/default.json` exactly, encode its bytes as base64 into the
`contentBase64` variable, and interpolate that variable into one Supabase SQL
statement:

```ts
import { readFile } from "node:fs/promises";

const contentBase64 = (
  await readFile("content/default.json")
).toString("base64");
const query = `
  with payload as (
    select convert_from(
      decode('${contentBase64}', 'base64'),
      'utf8'
    )::jsonb as content
  ),
  updated as (
    update public.portfolio_documents as documents
    set content = payload.content,
        updated_at = now()
    from payload
    where documents.key in ('draft', 'published')
    returning documents.key, documents.content
  )
  select
    count(*)::int as updated_rows,
    array_agg(key order by key) as keys,
    bool_and(content ? 'legal') as all_have_legal,
    bool_and(
      content::text like '%https://www.linkedin.com/%'
    ) as all_have_linkedin
  from updated;
`;
```

Expected:

```text
updated_rows = 2
keys = {draft,published}
all_have_legal = true
all_have_linkedin = true
```

- [ ] **Step 5: Verify final production content and consent**

Verify over HTTPS:

- all six public route samples return 200;
- the production Home HTML contains LinkedIn, Instagram, Legal, and Privacy;
- `/fr/legal` contains the configured Vercel identity and address;
- `/en/privacy` contains the privacy sections;
- no external-video request occurs before consent;
- the admin loads the Legal tab with remote values;
- `main` is clean and matches `origin/main`.

Only after these checks may completion be reported.
