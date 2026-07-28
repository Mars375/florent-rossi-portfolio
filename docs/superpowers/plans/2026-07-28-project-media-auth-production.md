# Project Media and Production Admin Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep homepage preview loops out of case studies, preserve a coherent gallery layout, and force production admin magic links back to `florentrossi.com`.

**Architecture:** A pure case-study media selector will remove the preview MP4 and GIF from `Project.gallery` before rendering. A pure site-URL helper will build the admin callback from the canonical production origin in production and from an explicitly configured local origin in development; the hosted Supabase Auth settings will be aligned with that callback after deployment.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Supabase Auth, Node test runner with TSX, PostCSS, Vercel.

## Global Constraints

- `Project.preview` is rendered on homepage cards only.
- `Project.fullVideo` remains the principal project-page film.
- Distinct gallery images and videos remain supported without a schema or database migration.
- A first-and-only gallery item keeps the large layout.
- Production admin callbacks always use `https://florentrossi.com`.
- Local callbacks are allowed only in development with an explicit local `NEXT_PUBLIC_SITE_URL`.
- The Supabase magic-link template uses `{{ .ConfirmationURL }}`.
- No access token, SMTP credential or new runtime dependency is stored in the repository.

---

### Task 1: Separate homepage previews from case-study galleries

**Files:**
- Create: `lib/content/case-study-media.ts`
- Modify: `app/components/ProjectView.tsx`
- Modify: `app/globals.css`
- Create: `tests/project-view.test.tsx`

**Interfaces:**
- Consumes: `Project`, `projectPreviewSources(project)`.
- Produces: `caseStudyGallery(project: Project): Project["gallery"]`.

- [ ] **Step 1: Write failing media-selection tests**

Create `tests/project-view.test.tsx` with a pure policy test:

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import type { Project } from "../content/schema";
import { defaultContent } from "../lib/content/fallback";
import { caseStudyGallery } from "../lib/content/case-study-media";

const afterdark = defaultContent.projects.find(
  (project) => project.id === "afterdark",
) as Project;

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
```

- [ ] **Step 2: Run the policy tests and verify RED**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/project-view.test.tsx
```

Expected: FAIL because `lib/content/case-study-media.ts` does not exist.

- [ ] **Step 3: Implement the pure media selector**

Create `lib/content/case-study-media.ts`:

```ts
import type { Project } from "../../content/schema";
import { projectPreviewSources } from "./preview";

export function caseStudyGallery(project: Project): Project["gallery"] {
  const { videoUrl, gifUrl } = projectPreviewSources(project);
  const previewUrls = new Set([videoUrl, gifUrl].filter(Boolean));

  return project.gallery.filter((media) => !previewUrls.has(media.url));
}
```

- [ ] **Step 4: Add failing rendering and layout tests**

Extend `tests/project-view.test.tsx` to render `ProjectView` inside the same
`AppRouterContext` and `PathnameContext` providers used by
`tests/footer-links.test.tsx`.

Assert for Afterdark:

```ts
assert.doesNotMatch(markup, /afterdark-loop\.mp4/);
assert.match(markup, /Direction lumière/);
```

Render a cloned project whose gallery contains only
`/media/florent/afterdark-case-film.mp4`, then assert:

```ts
assert.match(markup, /class="visual-large"/);
assert.match(markup, /afterdark-case-film\.mp4/);
```

Parse `app/globals.css` with PostCSS and assert the offset selector is exactly:

```css
.visual-sequence figure:last-child:not(:first-child)
```

- [ ] **Step 5: Run the rendering tests and verify RED**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/project-view.test.tsx
```

Expected: FAIL because `ProjectView` still maps `project.gallery` directly and
the CSS still targets every `figure:last-child`.

- [ ] **Step 6: Use the selector in `ProjectView` and fix the last-item rule**

In `app/components/ProjectView.tsx`, import `caseStudyGallery`, compute:

```ts
const gallery = caseStudyGallery(project);
```

Use `gallery.length` and `gallery.map` instead of `project.gallery`.

In `app/globals.css`, replace:

```css
.visual-sequence figure:last-child
```

with:

```css
.visual-sequence figure:last-child:not(:first-child)
```

Update the matching mobile selector to:

```css
.visual-sequence figure,
.visual-sequence figure:last-child:not(:first-child)
```

- [ ] **Step 7: Verify Task 1**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/project-view.test.tsx tests/footer-links.test.tsx tests/preview.test.ts
node node_modules/eslint/bin/eslint.js lib/content/case-study-media.ts app/components/ProjectView.tsx tests/project-view.test.tsx
node node_modules/typescript/bin/tsc --noEmit
git diff --check
```

Expected: all commands succeed with pristine output.

- [ ] **Step 8: Commit Task 1**

```powershell
git add lib/content/case-study-media.ts app/components/ProjectView.tsx app/globals.css tests/project-view.test.tsx
git commit -m "fix: separate project previews from case studies"
```

---

### Task 2: Canonicalize the production admin callback

**Files:**
- Modify: `lib/site-url.ts`
- Modify: `app/admin/login/LoginForm.tsx`
- Modify: `tests/site-url.test.ts`
- Modify: `tests/auth-flow.test.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: `adminAuthCallbackUrl(configuredSiteUrl?: string, environment?: string): string`.
- Consumes: `PRODUCTION_SITE_URL`, `getSiteUrl(value?)`.

- [ ] **Step 1: Write failing callback-policy tests**

Add to `tests/site-url.test.ts`:

```ts
import { adminAuthCallbackUrl } from "../lib/site-url";

test("pins production admin authentication to florentrossi.com", () => {
  assert.equal(
    adminAuthCallbackUrl("http://localhost:3000", "production"),
    "https://florentrossi.com/auth/confirm?next=/admin",
  );
});

test("allows an explicitly configured localhost callback in development", () => {
  assert.equal(
    adminAuthCallbackUrl("http://localhost:3000", "development"),
    "http://localhost:3000/auth/confirm?next=/admin",
  );
});
```

Add to `tests/auth-flow.test.ts`:

```ts
test("login uses the canonical callback helper rather than the browser origin", async () => {
  const source = await readFile("app/admin/login/LoginForm.tsx", "utf8");
  assert.match(source, /adminAuthCallbackUrl\(\)/);
  assert.doesNotMatch(source, /window\.location\.origin/);
});
```

- [ ] **Step 2: Run the callback tests and verify RED**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/site-url.test.ts tests/auth-flow.test.ts
```

Expected: FAIL because `adminAuthCallbackUrl` does not exist and the login
still uses `window.location.origin`.

- [ ] **Step 3: Implement the canonical callback helper**

Add to `lib/site-url.ts`:

```ts
export function adminAuthCallbackUrl(
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  environment = process.env.NODE_ENV,
): string {
  const base =
    environment === "production"
      ? getCanonicalSiteUrl()
      : getSiteUrl(configuredSiteUrl);

  return new URL("/auth/confirm?next=/admin", base).toString();
}
```

In `app/admin/login/LoginForm.tsx`, import this helper and replace the current
origin-derived value with:

```ts
const redirectTo = adminAuthCallbackUrl();
```

- [ ] **Step 4: Document the exact hosted Auth configuration**

Replace the placeholder domain in the Supabase deployment section of
`README.md` with:

```md
- Site URL: `https://florentrossi.com`
- Redirect URL:
  `https://florentrossi.com/auth/confirm?next=/admin`
- Magic-link template link: `{{ .ConfirmationURL }}`
```

Retain the local-development redirect only as an additional URL, never as the
hosted Site URL.

- [ ] **Step 5: Verify Task 2**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/site-url.test.ts tests/auth-flow.test.ts tests/auth.test.ts
node node_modules/eslint/bin/eslint.js lib/site-url.ts app/admin/login/LoginForm.tsx tests/site-url.test.ts tests/auth-flow.test.ts
node node_modules/typescript/bin/tsc --noEmit
git diff --check
```

Expected: all commands succeed with pristine output.

- [ ] **Step 6: Commit Task 2**

```powershell
git add lib/site-url.ts app/admin/login/LoginForm.tsx tests/site-url.test.ts tests/auth-flow.test.ts README.md
git commit -m "fix: pin admin magic links to production"
```

---

### Task 3: Validate, deploy and align hosted Supabase Auth

**Files:**
- No repository file changes.

**Interfaces:**
- Consumes: deployed commit from Tasks 1 and 2.
- Produces: production Vercel deployment and hosted Supabase Auth configuration.

- [ ] **Step 1: Run the full local verification**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test "tests/**/*.test.ts" "tests/**/*.test.tsx"
node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
git diff --check
```

Expected: all tests pass, lint and TypeScript are clean, the production build
succeeds, and the worktree is clean.

- [ ] **Step 2: Merge and deploy**

Fast-forward the reviewed branch to `main`, re-run the full tests on `main`,
push `main` to GitHub, and wait for the Vercel status attached to the deployed
commit to become `success`.

- [ ] **Step 3: Update hosted Supabase Auth**

In project `kzowrkfounzeytgtvndh`, open:

`https://supabase.com/dashboard/project/kzowrkfounzeytgtvndh/auth/url-configuration`

Set:

```text
Site URL
https://florentrossi.com

Redirect URLs
https://florentrossi.com/auth/confirm?next=/admin
```

Keep `http://localhost:3000/**` only as an additional development redirect if
local Auth testing is still desired.

Open:

`https://supabase.com/dashboard/project/kzowrkfounzeytgtvndh/auth/templates`

Set the Magic Link button or link target to:

```text
{{ .ConfirmationURL }}
```

- [ ] **Step 4: Verify production**

Verify:

```text
https://florentrossi.com/fr/work/afterdark
https://florentrossi.com/fr/work/orbital-radio
https://florentrossi.com/admin/login
```

Expected:

- Afterdark shows the Vimeo principal film but not
  `/media/florent/afterdark-loop.mp4` in the gallery.
- Orbital Radio does not render an empty visual-sequence section.
- A project with one distinct gallery media renders that item as
  `visual-large`.
- A new admin email link contains the production callback or a Supabase
  confirmation URL whose `redirect_to` value is the production callback.
- Clicking that fresh link reaches `/admin`, never localhost.

---
