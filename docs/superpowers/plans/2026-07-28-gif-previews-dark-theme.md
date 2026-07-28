# GIF Previews and Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace project-grid video playback with deferred three-second GIF previews, add an accessible persistent light/dark theme, and remove media zoom on hover.

**Architecture:** Pure helpers in `lib/` decide whether an animated preview is eligible and resolve the initial theme, so behavior can be tested without a browser. `ProjectCard` swaps one image element between poster and GIF only after an eligible hover/focus interaction, while the existing MP4 URLs remain in content for case-study media. An inline pre-hydration script sets the root theme, and a small client toggle owns manual changes and persistence.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS custom properties, Node test runner via `tsx`, ffmpeg-static, Sharp, Supabase, GitHub, Vercel.

## Global Constraints

- Generate exactly five `/media/florent/<slug>-preview.gif` files from the existing MP4 loops.
- Each GIF is 640 px wide at most, preserves aspect ratio, lasts 3 seconds, contains exactly 24 frames at 8 fps, loops forever, and is at most 2,000,000 bytes.
- A card shows its poster at rest and only assigns the GIF URL after hover or keyboard focus on a fine-pointer device that supports hover.
- Mobile, coarse-pointer devices, missing GIFs, failed GIFs, and `prefers-reduced-motion: reduce` always retain the static poster.
- Project-grid cards no longer render or download MP4 previews; case-study MP4 media remains unchanged.
- The initial theme follows `prefers-color-scheme`; a manual light/dark choice is stored under `florent-rossi-theme` and takes precedence.
- The dark palette is paper `#11110f`, ink `#f2ebdd`, coral `#ff6a45`, acid `#dfff45`, muted `#b8b0a4`, and line `rgba(242, 235, 221, 0.30)`.
- The light palette remains paper `#f2ebdd`, ink `#151515`, coral `#ff5b35`, acid `#dfff45`, muted `#746f65`, and line `rgba(21, 21, 21, 0.32)`.
- Public routes and admin preview routes follow the selected theme; the admin editor and login surfaces retain an explicit stable light treatment.
- Remove scale transforms from project-card media and `.case-film`; retain unrelated navigation, ticker, badge, and decorative transforms.
- Preserve the existing bilingual JSON schema and use `preview.fallbackGifUrl`; do not add a new content field.
- Use the existing dependencies; do not add a GIF, animation, state-management, or theme package.
- Use `https://florentrossi.fr` as the canonical production origin and redirect `https://www.florentrossi.fr` permanently to it.
- Preserve all existing mail-related DNS records; only add or replace the web records explicitly requested by Vercel.

---

## File Structure

### New files

- `lib/content/preview.ts` — pure selection and capability rules for project preview GIFs.
- `lib/theme.ts` — theme types, storage key, pure resolution functions, DOM application helper, and pre-hydration script.
- `lib/site-url.ts` — validated canonical site origin and localized canonical URL helpers.
- `app/components/ThemeToggle.tsx` — localized client-side theme control.
- `tests/preview.test.ts` — pure tests for GIF URL selection and motion eligibility.
- `tests/project-card.test.ts` — integration-level source assertions for the poster/GIF card and zoom removal.
- `tests/theme.test.ts` — theme resolution, bootstrap, integration, and palette contrast tests.
- `tests/site-url.test.ts` — canonical production origin and localized alternate metadata tests.
- `public/media/florent/*-preview.gif` — five deterministic generated preview files.

### Modified files

- `scripts/generate-demo-media.mjs` — generate deterministic optimized GIFs after each MP4/poster pair.
- `tests/demo-media.test.ts` — inspect GIF signature, dimensions, frames, duration, loop, size, uniqueness, idempotence, and content paths.
- `content/default.json` — set each project’s `preview.fallbackGifUrl`.
- `app/components/ProjectCard.tsx` — remove `<video>` and touch playback; swap poster/GIF on eligible hover/focus.
- `app/components/SiteHeader.tsx` — group language and theme controls.
- `app/layout.tsx` — apply the theme before first paint.
- `app/[locale]/page.tsx` — home canonical and FR/EN alternate metadata.
- `app/[locale]/about/page.tsx` — about canonical and FR/EN alternate metadata.
- `app/[locale]/work/[slug]/page.tsx` — project canonical and FR/EN alternate metadata.
- `app/globals.css` — theme tokens, toggle styling, GIF state styling, admin isolation, contrast-safe accent text, and removal of media zoom.
- `.env.example` — document the canonical production site URL.
- `docs/client-editor-guide.md` — describe poster/GIF grid behavior and retained MP4 case-study usage.

---

### Task 1: Preview Eligibility and GIF Selection

**Files:**
- Create: `lib/content/preview.ts`
- Create: `tests/preview.test.ts`

**Interfaces:**
- Consumes: `Project` from `content/schema.ts`.
- Produces: `projectPreviewGifUrl(project: Project): string` and `canUseAnimatedPreview(input: PreviewEnvironment): boolean`.

- [ ] **Step 1: Write the failing pure behavior tests**

Create `tests/preview.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";
import {
  canUseAnimatedPreview,
  projectPreviewGifUrl,
} from "../lib/content/preview";

const project = parsePortfolioContent(content).projects[0];

test("selects the fallback GIF without replacing the MP4 content URL", () => {
  const withGif = structuredClone(project);
  withGif.preview.fallbackGifUrl =
    "/media/florent/afterdark-preview.gif";

  assert.equal(
    projectPreviewGifUrl(withGif),
    "/media/florent/afterdark-preview.gif",
  );
  assert.equal(withGif.preview.url, "/media/florent/afterdark-loop.mp4");
});

test("supports a direct GIF preview and safely accepts no GIF", () => {
  const directGif = structuredClone(project);
  directGif.preview.type = "gif";
  directGif.preview.url = "https://cdn.example.com/preview.gif";
  directGif.preview.fallbackGifUrl = "";

  const posterOnly = structuredClone(project);
  posterOnly.preview.fallbackGifUrl = "";

  assert.equal(
    projectPreviewGifUrl(directGif),
    "https://cdn.example.com/preview.gif",
  );
  assert.equal(projectPreviewGifUrl(posterOnly), "");
});

test("permits animation only with GIF, hover, fine pointer and full motion", () => {
  const eligible = {
    gifUrl: "/media/florent/afterdark-preview.gif",
    canHover: true,
    finePointer: true,
    reducedMotion: false,
  };

  assert.equal(canUseAnimatedPreview(eligible), true);
  assert.equal(canUseAnimatedPreview({ ...eligible, gifUrl: "" }), false);
  assert.equal(canUseAnimatedPreview({ ...eligible, canHover: false }), false);
  assert.equal(canUseAnimatedPreview({ ...eligible, finePointer: false }), false);
  assert.equal(canUseAnimatedPreview({ ...eligible, reducedMotion: true }), false);
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run:

```powershell
npx tsx --test tests/preview.test.ts
```

Expected: FAIL with `Cannot find module '../lib/content/preview'`.

- [ ] **Step 3: Implement the minimal pure helper**

Create `lib/content/preview.ts`:

```ts
import type { Project } from "../../content/schema";

export type PreviewEnvironment = {
  gifUrl: string;
  canHover: boolean;
  finePointer: boolean;
  reducedMotion: boolean;
};

export function projectPreviewGifUrl(project: Project): string {
  if (project.preview.fallbackGifUrl) {
    return project.preview.fallbackGifUrl;
  }

  return project.preview.type === "gif" ? project.preview.url : "";
}

export function canUseAnimatedPreview({
  gifUrl,
  canHover,
  finePointer,
  reducedMotion,
}: PreviewEnvironment): boolean {
  return Boolean(gifUrl) && canHover && finePointer && !reducedMotion;
}
```

- [ ] **Step 4: Run the focused test**

Run:

```powershell
npx tsx --test tests/preview.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the preview policy**

```powershell
git add lib/content/preview.ts tests/preview.test.ts
git commit -m "feat: define deferred GIF preview policy"
```

---

### Task 2: Deterministic GIF Assets and JSON References

**Files:**
- Modify: `scripts/generate-demo-media.mjs`
- Modify: `tests/demo-media.test.ts`
- Modify: `content/default.json`
- Create: `public/media/florent/afterdark-preview.gif`
- Create: `public/media/florent/nuit-35-preview.gif`
- Create: `public/media/florent/orbital-radio-preview.gif`
- Create: `public/media/florent/material-memory-preview.gif`
- Create: `public/media/florent/sans-titre-08-preview.gif`

**Interfaces:**
- Consumes: the five existing `*-loop.mp4` files and project IDs.
- Produces: five exact `*-preview.gif` URLs in `preview.fallbackGifUrl`, while `preview.url` remains each project’s MP4.

- [ ] **Step 1: Extend the media tests before generating files**

In `tests/demo-media.test.ts`, include GIFs in `generatedNames`:

```ts
const generatedNames = [
  ...ids.flatMap((id) => [
    `${id}-loop.mp4`,
    `${id}-poster.jpg`,
    `${id}-preview.gif`,
  ]),
  "about-poster.jpg",
];
```

Add the GIF test:

```ts
test("ships five distinct optimized three-second GIF previews", async () => {
  const hashes = new Set<string>();

  for (const id of ids) {
    const gifPath = `${outputDirectory}/${id}-preview.gif`;
    const file = await readFile(gifPath);
    const fileSize = (await stat(gifPath)).size;
    const metadata = await sharp(gifPath, { animated: true }).metadata();
    const inspection = inspectVideo(gifPath);

    assert.match(file.subarray(0, 6).toString("ascii"), /^GIF8[79]a$/);
    assert.equal(metadata.format, "gif");
    assert.equal(metadata.width, 640);
    assert.equal(metadata.height, 360);
    assert.equal(metadata.pages, 24);
    assert.equal(metadata.loop, 0);
    assert.ok(fileSize > 10_000 && fileSize <= 2_000_000);
    assert.match(inspection, /Duration: 00:00:03\.00/);
    assert.match(inspection, /640x360.*8 fps/);
    hashes.add(createHash("sha256").update(file).digest("hex"));
  }

  assert.equal(hashes.size, ids.length);
});
```

Extend the inline project type used by `content consumes the exact local media asset paths`:

```ts
preview: { url: string; fallbackGifUrl: string };
```

Then extend the object created by the mapping:

```ts
fallbackGifUrl: project.preview.fallbackGifUrl,
```

and its expected object:

```ts
fallbackGifUrl: `/media/florent/${id}-preview.gif`,
```

- [ ] **Step 2: Run the media test and verify missing GIF failure**

Run:

```powershell
npx tsx --test tests/demo-media.test.ts
```

Expected: FAIL with `ENOENT` for `afterdark-preview.gif` or with an empty `fallbackGifUrl`.

- [ ] **Step 3: Add deterministic GIF generation**

In `generateLoop`, declare:

```js
const gifPath = join(outputDirectory, `${id}-preview.gif`);
```

After poster generation, invoke ffmpeg with the exact filter and output settings:

```js
runFfmpeg([
  "-i",
  videoPath,
  "-t",
  "3",
  "-an",
  "-vf",
  "fps=8,scale=640:-2:flags=lanczos,split[frames][paletteInput];[paletteInput]palettegen=max_colors=64:stats_mode=diff[palette];[frames][palette]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
  "-loop",
  "0",
  gifPath,
]);
```

This single filter graph deterministically derives the optimized palette from the same frames that it encodes.

- [ ] **Step 4: Set all five JSON GIF paths**

In `content/default.json`, replace the five empty values with these exact project/path pairs:

```json
{
  "afterdark": "/media/florent/afterdark-preview.gif",
  "nuit-35": "/media/florent/nuit-35-preview.gif",
  "orbital-radio": "/media/florent/orbital-radio-preview.gif",
  "material-memory": "/media/florent/material-memory-preview.gif",
  "sans-titre-08": "/media/florent/sans-titre-08-preview.gif"
}
```

The object above documents the mapping; write each value into the matching project’s existing `preview.fallbackGifUrl`. Do not change `preview.type`, `preview.url`, or the gallery video URL.

- [ ] **Step 5: Generate all media**

Run:

```powershell
npm run generate:media
```

Expected: exit 0 and five new GIF files in `public/media/florent`.

- [ ] **Step 6: Run schema, personal-content, and media tests**

Run:

```powershell
npx tsx --test tests/content-schema.test.ts tests/personal-portfolio.test.ts tests/demo-media.test.ts
```

Expected: all tests PASS, including exact 24-frame/2 MB GIF constraints and generator idempotence.

- [ ] **Step 7: Commit media and content**

```powershell
git add scripts/generate-demo-media.mjs tests/demo-media.test.ts content/default.json public/media/florent
git commit -m "feat: generate optimized project preview GIFs"
```

---

### Task 3: Poster-to-GIF Project Cards Without Media Zoom

**Files:**
- Create: `tests/project-card.test.ts`
- Modify: `app/components/ProjectCard.tsx`
- Modify: `app/globals.css`
- Modify: `docs/client-editor-guide.md`

**Interfaces:**
- Consumes: `projectPreviewGifUrl(Project)` and `canUseAnimatedPreview(PreviewEnvironment)` from Task 1.
- Produces: a single `<img>` card media element whose `src` is poster by default and GIF only while an eligible interaction is active.

- [ ] **Step 1: Write integration assertions for the component and CSS**

Create `tests/project-card.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("project cards use deferred GIF images without video or touch playback", async () => {
  const source = await readFile("app/components/ProjectCard.tsx", "utf8");

  assert.match(source, /projectPreviewGifUrl/);
  assert.match(source, /canUseAnimatedPreview/);
  assert.match(source, /onMouseEnter/);
  assert.match(source, /onMouseLeave/);
  assert.match(source, /onFocus/);
  assert.match(source, /onBlur/);
  assert.match(source, /onError/);
  assert.match(source, /00:03/);
  assert.doesNotMatch(source, /<video/);
  assert.doesNotMatch(source, /videoRef|touchPreview|preview-toggle/);
});

test("card and case-study media have no hover scale transform", async () => {
  const css = await readFile("app/globals.css", "utf8");

  assert.doesNotMatch(
    css,
    /\.project-media:(?:hover|focus-within)[^{]*\{[^}]*scale\(/s,
  );
  assert.doesNotMatch(
    css,
    /\.case-film:hover[^{]*\{[^}]*scale\(/s,
  );
  assert.doesNotMatch(
    css,
    /\.project-media (?:img|video)[^{]*\{[^}]*transition:[^;}]*transform/s,
  );
});
```

- [ ] **Step 2: Run the integration test and verify it fails**

Run:

```powershell
npx tsx --test tests/project-card.test.ts
```

Expected: FAIL because `ProjectCard` still renders `<video>` and CSS still contains both scale transforms.

- [ ] **Step 3: Replace video playback with a deferred GIF source**

Replace `app/components/ProjectCard.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale, Project } from "../../content/schema";
import {
  canUseAnimatedPreview,
  projectPreviewGifUrl,
} from "../../lib/content/preview";

export function ProjectCard({
  project,
  locale,
  playingLabel,
  viewLabel,
  routeBase = "",
}: {
  project: Project;
  locale: Locale;
  playingLabel: string;
  viewLabel: string;
  routeBase?: string;
}) {
  const gifUrl = projectPreviewGifUrl(project);
  const [previewEligible, setPreviewEligible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover)");
    const pointer = window.matchMedia("(pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      const eligible = canUseAnimatedPreview({
        gifUrl,
        canHover: hover.matches,
        finePointer: pointer.matches,
        reducedMotion: motion.matches,
      });
      setPreviewEligible(eligible);
      if (!eligible) {
        setHovered(false);
        setFocused(false);
      }
    };

    update();
    hover.addEventListener("change", update);
    pointer.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      hover.removeEventListener("change", update);
      pointer.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, [gifUrl]);

  const showGif = previewEligible && (hovered || focused) && !gifFailed;
  const number = String(project.order).padStart(2, "0");
  const projectHref = `${routeBase}/${locale}/work/${project.slug}`;

  return (
    <article className={`project-card project-${project.layout}`}>
      <div
        className={`project-media ${showGif ? "is-previewing" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link
          className="project-media-link focus-ring"
          href={projectHref}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={`${viewLabel}: ${project.title[locale]}`}
        >
          {/* The source is client-managed JSON and may use any HTTPS host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showGif ? gifUrl : project.posterUrl}
            alt=""
            loading={project.order === 1 ? "eager" : "lazy"}
            onError={() => {
              if (showGif) {
                setGifFailed(true);
                setHovered(false);
                setFocused(false);
              }
            }}
          />
          <span className={`playing-badge ${showGif ? "is-visible" : ""}`}>
            {playingLabel} 00:03
          </span>
          <span className={`preview-progress ${showGif ? "is-active" : ""}`} />
        </Link>
      </div>
      <Link className="project-meta focus-ring" href={projectHref}>
        <span>{number}</span>
        <h2>{project.title[locale]}</h2>
        <span>{project.discipline[locale]}</span>
        <span>{project.year}</span>
      </Link>
    </article>
  );
}
```

- [ ] **Step 4: Remove obsolete video/touch/zoom CSS and set three-second progress**

In `app/globals.css`:

- change `.project-media img, .project-media video` to `.project-media img`;
- keep positioning, sizing, and `object-fit`, but remove `transform` from its transition;
- delete `.project-media video`, `.project-media.is-playing video`, `.project-media:hover img`, `.project-media:focus-within img`, and `.preview-toggle`;
- change `.preview-progress.is-active` to `animation: preview-progress 3s linear infinite`;
- delete `transition: transform ...` from `.case-film .full-video`;
- delete the complete `.case-film:hover .full-video` rule.

The resulting media declaration is:

```css
.project-media img {
  position: absolute;
  inset: 0;
  height: 100%;
  object-fit: cover;
  transition: filter 350ms ease;
}
```

- [ ] **Step 5: Update the client media guidance**

Replace the first two paragraphs under `## Ajouter les vidéos et les images` in `docs/client-editor-guide.md` with:

```markdown
Pour la grille de projets, ajoutez une affiche JPG, PNG ou WebP et un GIF
d’aperçu court. L’affiche est toujours visible au repos. Sur ordinateur, le
GIF se charge seulement au survol ou au focus clavier; sur mobile et pour les
personnes qui réduisent les animations, l’affiche reste statique.

Conservez également une boucle MP4 ou WebM courte dans le champ vidéo. Elle
n’est pas chargée par la grille, mais reste disponible dans l’étude de cas.
Pour une page rapide, visez moins de 500 Ko pour l’affiche, moins de 2 Mo pour
un GIF de trois secondes et moins de 4 Mo pour la boucle vidéo.
```

Keep the existing full-film and Supabase upload guidance.

- [ ] **Step 6: Run focused and regression tests**

Run:

```powershell
npx tsx --test tests/preview.test.ts tests/project-card.test.ts tests/content-schema.test.ts
npm run typecheck
```

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit the card interaction**

```powershell
git add app/components/ProjectCard.tsx app/globals.css docs/client-editor-guide.md tests/project-card.test.ts
git commit -m "feat: use deferred GIFs for project cards"
```

---

### Task 4: Theme Resolution, Bootstrap, and Persistent Toggle

**Files:**
- Create: `lib/theme.ts`
- Create: `tests/theme.test.ts`
- Create: `app/components/ThemeToggle.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/components/SiteHeader.tsx`

**Interfaces:**
- Produces: `Theme`, `THEME_STORAGE_KEY`, `isTheme`, `resolveTheme`, `nextTheme`, `applyTheme`, and `themeBootstrapScript`.
- `ThemeToggle` consumes `locale: Locale`; `SiteHeader` renders it beside `LanguageSwitcher`.

- [ ] **Step 1: Write theme helper and integration tests**

Create `tests/theme.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  themeBootstrapScript,
} from "../lib/theme";

test("stored theme takes precedence over the system preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(null, false), "light");
  assert.equal(resolveTheme("sepia", true), "dark");
});

test("theme toggle always selects the opposite explicit theme", () => {
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "light");
});

test("bootstrap uses the stable key, system fallback and root data attribute", () => {
  const source = themeBootstrapScript();

  assert.equal(THEME_STORAGE_KEY, "florent-rossi-theme");
  assert.match(source, /florent-rossi-theme/);
  assert.match(source, /prefers-color-scheme: dark/);
  assert.match(source, /localStorage\.getItem/);
  assert.match(source, /dataset\.theme/);
  assert.match(source, /colorScheme/);
});

test("layout installs the bootstrap before hydration", async () => {
  const layout = await readFile("app/layout.tsx", "utf8");

  assert.match(layout, /suppressHydrationWarning/);
  assert.match(layout, /themeBootstrapScript/);
  assert.match(layout, /dangerouslySetInnerHTML/);
});

test("header renders one localized theme toggle beside language controls", async () => {
  const [header, toggle] = await Promise.all([
    readFile("app/components/SiteHeader.tsx", "utf8"),
    readFile("app/components/ThemeToggle.tsx", "utf8"),
  ]);

  assert.match(header, /header-actions/);
  assert.match(header, /ThemeToggle/);
  assert.match(toggle, /Activer le mode sombre/);
  assert.match(toggle, /Activer le mode clair/);
  assert.match(toggle, /Enable dark mode/);
  assert.match(toggle, /Enable light mode/);
  assert.match(toggle, /aria-pressed/);
  assert.match(toggle, /localStorage\.setItem/);
  assert.match(toggle, /matchMedia/);
});
```

- [ ] **Step 2: Run the test and verify missing theme module failure**

Run:

```powershell
npx tsx --test tests/theme.test.ts
```

Expected: FAIL with `Cannot find module '../lib/theme'`.

- [ ] **Step 3: Implement theme primitives and bootstrap source**

Create `lib/theme.ts`:

```ts
export const THEME_STORAGE_KEY = "florent-rossi-theme";
export const themes = ["light", "dark"] as const;
export type Theme = (typeof themes)[number];

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(
  stored: unknown,
  systemPrefersDark: boolean,
): Theme {
  if (isTheme(stored)) return stored;
  return systemPrefersDark ? "dark" : "light";
}

export function nextTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function themeBootstrapScript(): string {
  return `(function(){var d=document.documentElement;var m=window.matchMedia("(prefers-color-scheme: dark)");var t="light";try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");t=s==="light"||s==="dark"?s:(m.matches?"dark":"light");}catch(e){t=m.matches?"dark":"light";}d.dataset.theme=t;d.style.colorScheme=t;}());`;
}
```

- [ ] **Step 4: Install the pre-paint bootstrap**

In `app/layout.tsx`, import `themeBootstrapScript`:

```ts
import { themeBootstrapScript } from "../lib/theme";
```

Render the root as:

```tsx
<html
  lang={documentLanguage(requestHeaders.get(REQUEST_LOCALE_HEADER))}
  suppressHydrationWarning
>
  <head>
    <script
      dangerouslySetInnerHTML={{ __html: themeBootstrapScript() }}
    />
  </head>
  <body>{children}</body>
</html>
```

- [ ] **Step 5: Create the localized persistent toggle**

Create `app/components/ThemeToggle.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Locale } from "../../content/schema";
import {
  applyTheme,
  isTheme,
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "../../lib/theme";

export function ThemeToggle({ locale }: { locale: Locale }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const readStoredTheme = () => {
      try {
        return window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        return null;
      }
    };
    const sync = () => {
      const stored = readStoredTheme();
      const rootTheme = document.documentElement.dataset.theme;
      const resolved = isTheme(stored)
        ? stored
        : isTheme(rootTheme)
          ? rootTheme
          : resolveTheme(null, media.matches);
      applyTheme(resolved);
      setTheme(resolved);
    };
    const followSystem = () => {
      if (!isTheme(readStoredTheme())) {
        const resolved = resolveTheme(null, media.matches);
        applyTheme(resolved);
        setTheme(resolved);
      }
    };

    sync();
    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, []);

  const target = nextTheme(theme);
  const label =
    locale === "fr"
      ? target === "dark"
        ? "Activer le mode sombre"
        : "Activer le mode clair"
      : target === "dark"
        ? "Enable dark mode"
        : "Enable light mode";

  return (
    <button
      className="theme-toggle focus-ring"
      type="button"
      aria-label={label}
      aria-pressed={theme === "dark"}
      onClick={() => {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, target);
        } catch {
          // The visual change still works when storage is unavailable.
        }
        applyTheme(target);
        setTheme(target);
      }}
    >
      <span aria-hidden="true">{target === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}
```

- [ ] **Step 6: Group the header controls**

In `app/components/SiteHeader.tsx`, add:

```ts
import { ThemeToggle } from "./ThemeToggle";
```

Replace the standalone language switcher with:

```tsx
<div className="header-actions">
  <LanguageSwitcher locale={locale} />
  <ThemeToggle locale={locale} />
</div>
```

- [ ] **Step 7: Run theme tests and typecheck**

Run:

```powershell
npx tsx --test tests/theme.test.ts
npm run typecheck
```

Expected: all theme tests PASS and TypeScript exits 0.

- [ ] **Step 8: Commit the theme runtime**

```powershell
git add lib/theme.ts tests/theme.test.ts app/components/ThemeToggle.tsx app/components/SiteHeader.tsx app/layout.tsx
git commit -m "feat: add persistent system-aware theme toggle"
```

---

### Task 5: Theme Palette, Accessible Contrast, and Admin Isolation

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/theme.test.ts`

**Interfaces:**
- Consumes: `data-theme="light" | "dark"` set by Task 4.
- Produces: the exact public palettes, contrast-safe foreground tokens, responsive header controls, and stable light admin editor variables.

- [ ] **Step 1: Add failing palette and contrast assertions**

Append to `tests/theme.test.ts`:

```ts
function luminance(hex: string): number {
  const channels = hex.match(/[0-9a-f]{2}/gi);
  assert.ok(channels);
  const [red, green, blue] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("CSS defines the exact light and dark portfolio palettes", async () => {
  const css = await readFile("app/globals.css", "utf8");

  for (const value of [
    "#f2ebdd",
    "#151515",
    "#ff5b35",
    "#746f65",
    "rgba(21, 21, 21, 0.32)",
    "#11110f",
    "#ff6a45",
    "#dfff45",
    "#b8b0a4",
    "rgba(242, 235, 221, 0.30)",
  ]) {
    assert.match(css, new RegExp(value.replace(/[().]/g, "\\$&"), "i"));
  }

  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /\.header-actions/);
  assert.match(css, /\.theme-toggle/);
  assert.match(css, /\.admin-shell[\s\S]*color-scheme:\s*light/);
});

test("semantic public foreground pairs meet WCAG AA for normal text", () => {
  assert.ok(contrast("#151515", "#f2ebdd") >= 4.5);
  assert.ok(contrast("#11110f", "#f2ebdd") >= 4.5);
  assert.ok(contrast("#151515", "#ff5b35") >= 4.5);
  assert.ok(contrast("#11110f", "#ff6a45") >= 4.5);
  assert.ok(contrast("#151515", "#dfff45") >= 4.5);
  assert.ok(contrast("#b8b0a4", "#11110f") >= 4.5);
  assert.ok(contrast("#6d675e", "#f2ebdd") >= 4.5);
  assert.ok(contrast("#b13a20", "#f2ebdd") >= 4.5);
});
```

- [ ] **Step 2: Run the test and verify palette integration fails**

Run:

```powershell
npx tsx --test tests/theme.test.ts
```

Expected: FAIL because no dark selector, toggle styling, or admin theme isolation exists.

- [ ] **Step 3: Replace root tokens with explicit light/dark theme blocks**

Replace the current `:root` block in `app/globals.css` with:

```css
:root,
:root[data-theme="light"] {
  --paper: #f2ebdd;
  --ink: #151515;
  --coral: #ff5b35;
  --coral-text: #b13a20;
  --acid: #dfff45;
  --accent-ink: #151515;
  --muted: #746f65;
  --muted-text: #6d675e;
  --line: rgba(21, 21, 21, 0.32);
  --serif: "Newsreader", "Iowan Old Style", "Baskerville", Georgia, serif;
  --sans: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
  color-scheme: light;
}

:root[data-theme="dark"] {
  --paper: #11110f;
  --ink: #f2ebdd;
  --coral: #ff6a45;
  --coral-text: #ff6a45;
  --acid: #dfff45;
  --accent-ink: #151515;
  --muted: #b8b0a4;
  --muted-text: #b8b0a4;
  --line: rgba(242, 235, 221, 0.30);
  color-scheme: dark;
}
```

Apply the semantic foreground tokens to these exact selectors:

```css
.locale-switch [aria-current="page"],
.hero h1 span:last-child,
.admin-localized-field label > span {
  color: var(--coral-text);
}

.credits dt,
.admin-project-list button span,
.admin-project-list button small,
.media-uploader small {
  color: var(--muted-text);
}

.hero-kicker,
.playing-badge,
.capability-strip,
.email-link,
.film-play,
.idea-section,
.process article:last-child,
.admin-preview-banner {
  color: var(--accent-ink);
}
```

Keep `var(--coral)` for coral backgrounds, progress bars, outlines, and other non-text accents.

- [ ] **Step 4: Add responsive header control styles**

Add after `.locale-switch`:

```css
.header-actions {
  display: flex;
  justify-self: end;
  gap: 14px;
  align-items: center;
}

.theme-toggle {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  font: inherit;
  cursor: pointer;
}

.theme-toggle:hover {
  background: var(--ink);
  color: var(--paper);
}

.theme-toggle span {
  font-size: 16px;
  line-height: 1;
}
```

The existing mobile two-column header remains valid because `.header-actions` occupies the right column.

- [ ] **Step 5: Isolate administration controls from the public theme**

Before the administration styles, add:

```css
.admin-shell,
.admin-login,
.admin-forbidden {
  --paper: #f2ebdd;
  --ink: #151515;
  --coral: #ff5b35;
  --coral-text: #b13a20;
  --acid: #dfff45;
  --accent-ink: #151515;
  --muted: #746f65;
  --muted-text: #6d675e;
  --line: rgba(21, 21, 21, 0.32);
  color-scheme: light;
}
```

Set `.admin-shell` to `color: var(--ink)` in addition to its existing stable light background. Do not apply this override to `.admin-preview`; its portfolio view must continue to inherit the public theme.

- [ ] **Step 6: Run theme, card, lint, and type checks**

Run:

```powershell
npx tsx --test tests/theme.test.ts tests/project-card.test.ts
npm run lint
npm run typecheck
```

Expected: all tests PASS; lint and TypeScript exit 0.

- [ ] **Step 7: Commit the visual theme**

```powershell
git add app/globals.css tests/theme.test.ts
git commit -m "feat: apply accessible light and dark palettes"
```

---

### Task 6: Canonical `florentrossi.fr` Metadata and Vercel Domain

**Files:**
- Create: `lib/site-url.ts`
- Create: `tests/site-url.test.ts`
- Modify: `app/layout.tsx`
- Modify: `app/[locale]/page.tsx`
- Modify: `app/[locale]/about/page.tsx`
- Modify: `app/[locale]/work/[slug]/page.tsx`
- Modify: `.env.example`
- External state: Vercel project domains/environment and the domain’s web DNS records.

**Interfaces:**
- Produces: `PRODUCTION_SITE_URL`, `getSiteUrl(value?: string): URL`, and `localizedAlternates(locale: Locale, path?: string, value?: string): Metadata["alternates"]`.
- The three localized route metadata functions consume `localizedAlternates`; root metadata consumes `getSiteUrl`.

- [ ] **Step 1: Write failing canonical-origin tests**

Create `tests/site-url.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getSiteUrl,
  localizedAlternates,
  PRODUCTION_SITE_URL,
} from "../lib/site-url";

test("uses florentrossi.fr as the safe canonical production origin", () => {
  assert.equal(PRODUCTION_SITE_URL, "https://florentrossi.fr");
  assert.equal(getSiteUrl(undefined).href, "https://florentrossi.fr/");
  assert.equal(
    getSiteUrl("https://preview.example.com").href,
    "https://preview.example.com/",
  );
  assert.equal(
    getSiteUrl("javascript:alert(1)").href,
    "https://florentrossi.fr/",
  );
  assert.equal(
    getSiteUrl("https://user:pass@example.com").href,
    "https://florentrossi.fr/",
  );
});

test("builds exact FR and EN canonical alternates", () => {
  const home = localizedAlternates("fr");
  const project = localizedAlternates("en", "/work/afterdark");

  assert.equal(home?.canonical?.toString(), "https://florentrossi.fr/fr");
  assert.equal(
    home?.languages?.fr.toString(),
    "https://florentrossi.fr/fr",
  );
  assert.equal(
    home?.languages?.en.toString(),
    "https://florentrossi.fr/en",
  );
  assert.equal(
    project?.canonical?.toString(),
    "https://florentrossi.fr/en/work/afterdark",
  );
  assert.equal(
    project?.languages?.fr.toString(),
    "https://florentrossi.fr/fr/work/afterdark",
  );
});

test("localized routes publish canonical and language metadata", async () => {
  const sources = await Promise.all([
    readFile("app/[locale]/page.tsx", "utf8"),
    readFile("app/[locale]/about/page.tsx", "utf8"),
    readFile("app/[locale]/work/[slug]/page.tsx", "utf8"),
  ]);

  assert.ok(sources.every((source) => source.includes("localizedAlternates")));
  assert.match(await readFile("app/layout.tsx", "utf8"), /getSiteUrl/);
  assert.match(
    await readFile(".env.example", "utf8"),
    /NEXT_PUBLIC_SITE_URL=https:\/\/florentrossi\.fr/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run:

```powershell
npx tsx --test tests/site-url.test.ts
```

Expected: FAIL with `Cannot find module '../lib/site-url'`.

- [ ] **Step 3: Implement validated canonical URL helpers**

Create `lib/site-url.ts`:

```ts
import type { Metadata } from "next";
import type { Locale } from "../content/schema";

export const PRODUCTION_SITE_URL = "https://florentrossi.fr";

export function getSiteUrl(
  value = process.env.NEXT_PUBLIC_SITE_URL,
): URL {
  try {
    const url = new URL(value || PRODUCTION_SITE_URL);
    const safeProtocol = url.protocol === "https:" || url.protocol === "http:";
    const cleanOrigin =
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash;

    return safeProtocol && cleanOrigin
      ? url
      : new URL(PRODUCTION_SITE_URL);
  } catch {
    return new URL(PRODUCTION_SITE_URL);
  }
}

export function localizedAlternates(
  locale: Locale,
  path = "",
  value?: string,
): Metadata["alternates"] {
  const base = getSiteUrl(value);
  const suffix = path === "" || path.startsWith("/") ? path : `/${path}`;

  return {
    canonical: new URL(`/${locale}${suffix}`, base),
    languages: {
      fr: new URL(`/fr${suffix}`, base),
      en: new URL(`/en${suffix}`, base),
    },
  };
}
```

- [ ] **Step 4: Make root social metadata use the configured canonical origin**

In `app/layout.tsx`, import:

```ts
import { getSiteUrl } from "../lib/site-url";
```

Inside `generateMetadata`, replace the forwarded-host/protocol construction with:

```ts
const baseUrl = getSiteUrl();
```

Keep `headers()` in `RootLayout` for document-language detection. Continue building `/og.png` from `baseUrl`.

- [ ] **Step 5: Add localized alternates to all public route metadata**

In `app/[locale]/page.tsx`, import:

```ts
import { localizedAlternates } from "../../lib/site-url";
```

In `app/[locale]/about/page.tsx`, import:

```ts
import { localizedAlternates } from "../../../lib/site-url";
```

In `app/[locale]/work/[slug]/page.tsx`, import:

```ts
import { localizedAlternates } from "../../../../lib/site-url";
```

Add these exact values to the metadata objects:

Home:

```ts
alternates: localizedAlternates(fr ? "fr" : "en"),
```

About:

```ts
alternates: localizedAlternates(
  locale === "fr" ? "fr" : "en",
  "/about",
),
```

Project:

```ts
alternates: localizedAlternates(locale, `/work/${project?.slug ?? slug}`),
```

Do not create canonical metadata for private `/admin` or `/admin/preview` routes.

- [ ] **Step 6: Pin the production environment example and run tests**

Change `.env.example` to:

```dotenv
NEXT_PUBLIC_SITE_URL=https://florentrossi.fr
```

Run:

```powershell
npx tsx --test tests/site-url.test.ts tests/personal-portfolio.test.ts tests/runtime-config.test.ts
npm run typecheck
```

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit canonical metadata**

```powershell
git add lib/site-url.ts tests/site-url.test.ts app/layout.tsx .env.example
git add -- ':(literal)app/[locale]/page.tsx' ':(literal)app/[locale]/about/page.tsx' ':(literal)app/[locale]/work/[slug]/page.tsx'
git commit -m "feat: make florentrossi.fr the canonical domain"
```

- [ ] **Step 8: Attach both domains to the linked Vercel project**

Open the linked Vercel project `atelier-vif-portfolio` (`prj_m2SexdcFpsvIV1j8joO6lMiRgYmz`) and add:

- `florentrossi.fr` as the primary production domain;
- `www.florentrossi.fr` as a redirect to `https://florentrossi.fr`.

Set the redirect as permanent. In the Vercel production environment, set:

```dotenv
NEXT_PUBLIC_SITE_URL=https://florentrossi.fr
```

Do not force-transfer either hostname if Vercel reports that it belongs to another account or project; stop and report the ownership verification record instead.

- [ ] **Step 9: Apply only the web DNS records requested by Vercel**

Inspect both domain cards after attachment. At the current DNS provider:

- apply the exact apex A/ALIAS value displayed for `florentrossi.fr`;
- apply the exact CNAME value displayed for `www.florentrossi.fr`;
- remove only conflicting apex/web A, AAAA, ALIAS, or CNAME records identified by Vercel;
- preserve every MX, SPF, DKIM, DMARC, verification TXT, and unrelated subdomain record.

If the DNS provider is not available in the authenticated browser session, report the registrar/provider name and the two exact Vercel-requested record changes for the user to apply; do not guess values or alter nameservers.

- [ ] **Step 10: Verify domain, TLS, redirect, and canonical tags**

After Vercel reports both domains valid, run:

```powershell
curl.exe -I https://florentrossi.fr/fr
curl.exe -I https://www.florentrossi.fr/fr
```

Expected:

- apex response is HTTP 200 with a valid Vercel-managed TLS certificate;
- `www` response is a permanent HTTP 301 or 308 redirect whose `Location` starts with `https://florentrossi.fr/`;
- the HTML for `/fr`, `/en`, `/fr/about`, and `/fr/work/afterdark` contains a canonical link on `https://florentrossi.fr`;
- no canonical link references `vercel.app` or `www.florentrossi.fr`.

---

### Task 7: Full Verification, Content Publication, and Production Deployment

**Files:**
- Verify: all modified source, tests, JSON, docs, and generated assets.
- External state: Supabase `portfolio_documents` draft/published rows, GitHub `main`, Vercel production.

**Interfaces:**
- Consumes: the complete implementation and `content/default.json`.
- Produces: synchronized draft/published content and a verified production deployment.

- [ ] **Step 1: Regenerate media and prove determinism**

Run:

```powershell
npm run generate:media
git status --short
```

Expected: generator exits 0 and `git status --short` reports no changes.

- [ ] **Step 2: Run the complete automated gate**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: every Node test passes and all three production checks exit 0.

- [ ] **Step 3: Audit tracked assets and forbidden media zoom**

Run:

```powershell
Get-ChildItem public/media/florent/*-preview.gif | Select-Object Name,Length
rg -n "project-media:hover|project-media:focus-within|case-film:hover|scale\\(" app/globals.css
git status --short
```

Expected:

- exactly five GIF rows, each no larger than 2,000,000 bytes;
- no project-media or case-film selector with `scale()`;
- unrelated `scaleX()` progress/underline transforms may still appear;
- clean working tree.

- [ ] **Step 4: Verify local desktop behavior**

Run:

```powershell
npm run dev
```

Open `/fr`, `/en`, `/fr/about`, and one `/fr/work/<slug>` route in the in-app browser. In the desktop viewport:

- confirm the initial theme follows the browser’s color-scheme preference;
- click the theme button and verify the root `data-theme` changes;
- reload and verify the manual choice persists;
- hover and keyboard-focus each project card and confirm a three-second GIF appears;
- inspect network requests and confirm no `*-preview.gif` request occurs before interaction;
- confirm no card or main case-study video changes scale.

- [ ] **Step 5: Verify mobile, reduced motion, and failure fallback**

In the in-app browser:

- use a mobile viewport and reload `/fr`;
- confirm posters remain static and no GIF or card MP4 request is made;
- emulate `prefers-reduced-motion: reduce` in a desktop viewport and confirm the same behavior;
- temporarily block one GIF request and confirm the corresponding poster remains visible and its project link works;
- restore normal request handling before continuing.

- [ ] **Step 6: Synchronize the exact JSON to Supabase**

Use the connected Supabase project `kzowrkfounzeytgtvndh`. Read and parse `content/default.json`, then update both `portfolio_documents` rows (`key = 'draft'` and `key = 'published'`) in one transaction with that exact JSON value. Do not change authentication, RLS, storage policies, or migrations.

Immediately query:

```sql
select
  key,
  jsonb_array_length(content->'projects') as project_count,
  content->'projects'->0->'preview'->>'fallbackGifUrl' as first_gif
from public.portfolio_documents
where key in ('draft', 'published')
order by key;
```

Expected: two rows, each with `project_count = 5` and `first_gif = /media/florent/afterdark-preview.gif`.

- [ ] **Step 7: Commit any verification-only correction**

If Steps 1–6 required a source correction, rerun the complete gate and commit only that correction with an exact message describing it. If no correction was required, make no empty commit.

- [ ] **Step 8: Push main and wait for Vercel**

Run:

```powershell
git status --short
git log -7 --oneline
git push origin main
```

Expected: clean worktree and successful push. Wait for the GitHub-triggered Vercel deployment on `florentrossi.fr` to become ready.

- [ ] **Step 9: Verify production routes and assets**

Check:

- `https://florentrossi.fr/fr`
- `https://florentrossi.fr/en`
- `https://florentrossi.fr/fr/about`
- `https://florentrossi.fr/fr/work/afterdark`
- `https://florentrossi.fr/media/florent/afterdark-preview.gif`
- `https://florentrossi.fr/media/florent/afterdark-loop.mp4`
- `https://www.florentrossi.fr/fr`

Expected:

- public pages and both media assets return HTTP 200;
- `www.florentrossi.fr` permanently redirects to `florentrossi.fr`;
- GIF response content type is `image/gif`;
- MP4 response content type is `video/mp4`;
- the production grid uses poster-to-GIF behavior, not MP4 autoplay;
- light/dark selection persists after production reload;
- mobile and reduced-motion modes remain static;
- no media zoom is visible.

- [ ] **Step 10: Record final evidence**

Report the final Git commit, automated test count, build status, Supabase verification rows, production URL, and the desktop/mobile/reduced-motion browser results. Do not claim completion without the outputs from Steps 1–9.
