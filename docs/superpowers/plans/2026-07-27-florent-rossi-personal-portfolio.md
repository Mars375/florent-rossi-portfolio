# Florent Rossi Personal Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recast the published portfolio as Florent Rossi’s personal art-direction portfolio and replace remote demonstration imagery with five distinct, self-hosted motion loops.

**Architecture:** Keep the existing validated JSON/Supabase document model and admin workflow. Extend media validation to allow versioned root-relative files under `public/media`, generate deterministic MP4 loops and matching posters through a repository script, then seed the same validated document into Supabase `draft` and `published`.

**Tech Stack:** Next.js 16.2.12, React 19, TypeScript, Zod, Node test runner, Supabase, `ffmpeg-static`, Sharp, Vercel.

## Global Constraints

- Public identity is exactly `Florent Rossi`.
- Public role is `Directeur artistique` in French and `Art Director` in English.
- Florent is explicitly seeking a permanent position in an agency or brand.
- Core positioning remains culture, music, and fashion.
- Public contact is `m.rossiflorent@gmail.com`.
- Public copy uses first-person singular, never a studio/team voice.
- The five demonstration projects remain fictitious and editable.
- Grid previews are distinct self-hosted MP4 loops, 5–7 seconds, muted, looping, and poster-backed.
- Desktop starts previews on hover/focus; touch and reduced-motion users retain the existing explicit/static behavior.
- The existing single-user admin, draft, preview, and explicit-publish flow remains intact.
- The final domain and Resend SMTP remain out of scope.

---

### Task 1: Support safe root-relative portfolio media

**Files:**
- Modify: `content/schema.ts`
- Modify: `tests/content-schema.test.ts`

**Interfaces:**
- Consumes: existing `portfolioContentSchema` and `parsePortfolioContent(value: unknown)`.
- Produces: `portfolioMediaUrlSchema`, accepted by poster, preview, gallery, and about-image fields while full-film and social URLs remain HTTPS-only.

- [ ] **Step 1: Write the failing media-path tests**

Add the following test to `tests/content-schema.test.ts`:

```ts
test("accepts versioned local media but rejects protocol-relative paths", () => {
  const local = structuredClone(content);
  local.about.imageUrl = "/media/florent/about-poster.jpg";
  local.projects[0].posterUrl = "/media/florent/afterdark-poster.jpg";
  local.projects[0].preview.url = "/media/florent/afterdark-loop.mp4";
  local.projects[0].gallery[0].url = "/media/florent/afterdark-loop.mp4";
  assert.doesNotThrow(() => parsePortfolioContent(local));

  const unsafe = structuredClone(local);
  unsafe.projects[0].preview.url = "//evil.example/loop.mp4";
  assert.throws(() => parsePortfolioContent(unsafe), /media|path|url/i);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npx tsx --test tests/content-schema.test.ts
```

Expected: FAIL because `/media/florent/...` does not satisfy the current HTTPS-only schema.

- [ ] **Step 3: Add the safe local-media schema**

In `content/schema.ts`, keep `httpsUrlSchema` unchanged and add:

```ts
const localMediaPathSchema = z
  .string()
  .regex(
    /^\/media\/[a-z0-9][a-z0-9/_-]*\.(?:gif|jpe?g|png|webp|mp4|webm)$/i,
    "Local media path must stay under /media",
  );

const portfolioMediaUrlSchema = z.union([
  httpsUrlSchema,
  localMediaPathSchema,
]);

const mediaUrlOrEmptySchema = z.union([
  z.literal(""),
  portfolioMediaUrlSchema,
]);
```

Use `portfolioMediaUrlSchema` for `posterUrl`, `gallery[].url`, and
`about.imageUrl`. Use `mediaUrlOrEmptySchema` for `preview.url` and
`preview.fallbackGifUrl`. Keep `fullVideo.url` and `site.socials[].url` on
`httpsUrlSchema`.

- [ ] **Step 4: Run schema tests and confirm GREEN**

Run:

```bash
npx tsx --test tests/content-schema.test.ts
```

Expected: all schema tests PASS.

- [ ] **Step 5: Commit the media contract**

```bash
git add content/schema.ts tests/content-schema.test.ts
git commit -m "feat: support self-hosted portfolio media"
```

---

### Task 2: Recast all public and admin copy around Florent Rossi

**Files:**
- Modify: `content/default.json`
- Modify: `app/layout.tsx`
- Modify: `app/admin/AdminEditor.tsx`
- Modify: `README.md`
- Modify: `docs/client-editor-guide.md`
- Modify: `tests/content-schema.test.ts`
- Create: `tests/personal-portfolio.test.ts`

**Interfaces:**
- Consumes: root-relative media support from Task 1.
- Produces: a valid `PortfolioContent` document with Florent’s personal identity and `/media/florent/*` references.

- [ ] **Step 1: Write the failing personal-identity regression test**

Create `tests/personal-portfolio.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";

test("presents Florent Rossi as one art director seeking a permanent role", () => {
  const parsed = parsePortfolioContent(content);
  const publicCopy = JSON.stringify({
    site: parsed.site,
    navigation: parsed.navigation,
    home: parsed.home,
    about: parsed.about,
  });

  assert.equal(parsed.site.name, "Florent Rossi");
  assert.equal(parsed.site.email, "m.rossiflorent@gmail.com");
  assert.equal(parsed.navigation.fr.about, "À propos");
  assert.equal(parsed.navigation.en.about, "About");
  assert.match(parsed.home.fr.intro, /poste permanent/i);
  assert.match(parsed.home.en.intro, /permanent position/i);
  assert.match(parsed.about.fr.intro, /je suis Florent Rossi/i);
  assert.match(parsed.about.en.intro, /I’m Florent Rossi/i);
  assert.doesNotMatch(
    publicCopy,
    /\bAtelier Vif\b|\bthe studio\b|\bcreative studio\b|\bNous\b|\bWe\b/,
  );
  assert.ok(
    parsed.projects.every((project) =>
      project.credits.some(
        (credit) =>
          credit.role === "Creative Direction" &&
          credit.name === "Florent Rossi",
      ),
    ),
  );
});

test("uses one distinct local motion loop and poster per project", () => {
  const parsed = parsePortfolioContent(content);
  const previews = parsed.projects.map((project) => project.preview.url);
  const posters = parsed.projects.map((project) => project.posterUrl);

  assert.equal(new Set(previews).size, 5);
  assert.equal(new Set(posters).size, 5);
  assert.ok(previews.every((url) => /^\/media\/florent\/.+-loop\.mp4$/.test(url)));
  assert.ok(posters.every((url) => /^\/media\/florent\/.+-poster\.jpg$/.test(url)));
});
```

- [ ] **Step 2: Run the identity test and confirm RED**

Run:

```bash
npx tsx --test tests/personal-portfolio.test.ts
```

Expected: FAIL on `Atelier Vif`, studio navigation, contact, permanent-position copy, credits, and local media paths.

- [ ] **Step 3: Apply the exact personal identity to the JSON**

Update these fields in `content/default.json`:

```json
{
  "site": {
    "name": "Florent Rossi",
    "email": "m.rossiflorent@gmail.com",
    "location": {
      "en": "Paris / Open to opportunities",
      "fr": "Paris / Ouvert aux opportunités"
    },
    "copyright": "© 2026 Florent Rossi"
  },
  "navigation": {
    "en": { "work": "Work", "about": "About", "contact": "Contact" },
    "fr": { "work": "Projets", "about": "À propos", "contact": "Contact" }
  }
}
```

Use the following exact home copy:

```json
{
  "en": {
    "heroLineOne": "Ideas move.",
    "heroLineTwo": "Images speak.",
    "intro": "I’m Florent Rossi, an art director working across culture, music and fashion. Based in Paris, I’m looking for a permanent position in an agency or brand.",
    "selectedWork": "Selected work 2022—26",
    "playing": "Playing",
    "viewProject": "View project",
    "scrollCue": "View work",
    "capabilities": "Strategy / Art direction / Campaigns / Film / Digital",
    "profile": "I build visual worlds where strategy, image and motion meet.",
    "profileLink": "About me",
    "footerTitle": "Let’s build what comes next."
  },
  "fr": {
    "heroLineOne": "Les idées bougent.",
    "heroLineTwo": "Les images parlent.",
    "intro": "Je suis Florent Rossi, directeur artistique entre culture, musique et mode. Basé à Paris, je recherche un poste permanent en agence ou chez une marque.",
    "selectedWork": "Projets choisis 2022—26",
    "playing": "En lecture",
    "viewProject": "Voir le projet",
    "scrollCue": "Voir les projets",
    "capabilities": "Stratégie / Direction artistique / Campagnes / Film / Digital",
    "profile": "Je construis des univers visuels où stratégie, image et mouvement se rencontrent.",
    "profileLink": "À propos de moi",
    "footerTitle": "Construisons la suite."
  }
}
```

Set `about.label` to `Florent Rossi / Paris`,
`about.imageUrl` to `/media/florent/about-poster.jpg`, and use:

```json
{
  "en": {
    "title": "An art director for ideas that refuse to sit still.",
    "imageAlt": "Graphic portrait placeholder for Florent Rossi",
    "intro": "I’m Florent Rossi, an art director shaping identities, campaigns and moving images across culture, music and fashion.",
    "manifesto": "I look for the right tension: between a clear idea and an image that refuses to be forgotten.",
    "availability": "Looking for a permanent position in an agency or brand",
    "credentials": "Request my résumé",
    "footerTitle": "Looking for your next art director?"
  },
  "fr": {
    "title": "Un directeur artistique pour les idées qui refusent de rester immobiles.",
    "imageAlt": "Portrait graphique temporaire de Florent Rossi",
    "intro": "Je suis Florent Rossi, directeur artistique. Je conçois des identités, campagnes et images en mouvement pour la culture, la musique et la mode.",
    "manifesto": "Je cherche la tension juste : entre une idée claire et une image impossible à oublier.",
    "availability": "En recherche d’un poste permanent en agence ou chez une marque",
    "credentials": "Demander mon CV",
    "footerTitle": "Vous cherchez votre prochain directeur artistique ?"
  }
}
```

Preserve the existing service, client, recognition, and process arrays. Replace
every credit `{ "role": "Creative Direction", "name": "Atelier Vif" }` with
`{ "role": "Creative Direction", "name": "Florent Rossi" }`.

Assign the project media paths:

```text
afterdark       /media/florent/afterdark-loop.mp4
                /media/florent/afterdark-poster.jpg
nuit-35         /media/florent/nuit-35-loop.mp4
                /media/florent/nuit-35-poster.jpg
orbital-radio   /media/florent/orbital-radio-loop.mp4
                /media/florent/orbital-radio-poster.jpg
material-memory /media/florent/material-memory-loop.mp4
                /media/florent/material-memory-poster.jpg
sans-titre-08   /media/florent/sans-titre-08-loop.mp4
                /media/florent/sans-titre-08-poster.jpg
```

Set each project `preview.type` to `video`, its `preview.url` to the matching
loop, and `preview.fallbackGifUrl` to an empty string. Replace each gallery’s
first item with the matching loop and set its `type` to `video`; keep the
remaining demonstration gallery items editable.

- [ ] **Step 4: Update metadata and admin terminology**

In `app/layout.tsx`, use:

```ts
const title = "Florent Rossi — Art Director";
const description =
  "Florent Rossi is a Paris-based art director working across culture, music and fashion, looking for a permanent position.";
```

Change the title template to:

```ts
template: "%s — Florent Rossi",
```

In `app/admin/AdminEditor.tsx`, change only UI labels:

```text
Studio tab                 → À propos
Nom du studio              → Nom affiché
Image du studio            → Portrait / visuel
Studio FR / Studio EN      → Profil FR / Profil EN
```

Update `README.md` and `docs/client-editor-guide.md` titles and prose from
Atelier Vif/studio wording to Florent Rossi/personal portfolio wording. Keep
all deployment, Supabase, Resend, and media instructions.

- [ ] **Step 5: Run content tests and confirm GREEN**

Run:

```bash
npx tsx --test tests/content-schema.test.ts tests/personal-portfolio.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit the personal identity**

```bash
git add content/default.json app/layout.tsx app/admin/AdminEditor.tsx README.md docs/client-editor-guide.md tests/content-schema.test.ts tests/personal-portfolio.test.ts
git commit -m "feat: recast portfolio around Florent Rossi"
```

---

### Task 3: Generate five real motion loops, posters, and the social card

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/generate-demo-media.mjs`
- Create: `tests/demo-media.test.ts`
- Create: `public/media/florent/afterdark-loop.mp4`
- Create: `public/media/florent/afterdark-poster.jpg`
- Create: `public/media/florent/nuit-35-loop.mp4`
- Create: `public/media/florent/nuit-35-poster.jpg`
- Create: `public/media/florent/orbital-radio-loop.mp4`
- Create: `public/media/florent/orbital-radio-poster.jpg`
- Create: `public/media/florent/material-memory-loop.mp4`
- Create: `public/media/florent/material-memory-poster.jpg`
- Create: `public/media/florent/sans-titre-08-loop.mp4`
- Create: `public/media/florent/sans-titre-08-poster.jpg`
- Create: `public/media/florent/about-poster.jpg`
- Modify: `public/og.png`

**Interfaces:**
- Consumes: exact `/media/florent/*` paths from Task 2.
- Produces: browser-readable H.264 MP4 loops, JPEG fallbacks, and a 1734×909 Florent Rossi social card.

- [ ] **Step 1: Write the failing binary-asset test**

Create `tests/demo-media.test.ts`:

```ts
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const ids = [
  "afterdark",
  "nuit-35",
  "orbital-radio",
  "material-memory",
  "sans-titre-08",
];

test("ships five distinct, optimized MP4 loops and matching posters", async () => {
  const hashes = new Set<string>();

  for (const id of ids) {
    const videoPath = `public/media/florent/${id}-loop.mp4`;
    const posterPath = `public/media/florent/${id}-poster.jpg`;
    const video = await readFile(videoPath);
    const poster = await readFile(posterPath);
    const videoSize = (await stat(videoPath)).size;

    assert.equal(video.subarray(4, 8).toString("ascii"), "ftyp");
    assert.deepEqual([...poster.subarray(0, 3)], [0xff, 0xd8, 0xff]);
    assert.ok(videoSize > 50_000 && videoSize < 4_000_000);
    hashes.add(createHash("sha256").update(video).digest("hex"));
  }

  assert.equal(hashes.size, ids.length);
  await stat("public/media/florent/about-poster.jpg");
  await stat("public/og.png");
});
```

- [ ] **Step 2: Run the asset test and confirm RED**

Run:

```bash
npx tsx --test tests/demo-media.test.ts
```

Expected: FAIL with `ENOENT` for the first missing MP4.

- [ ] **Step 3: Add deterministic media-generation dependencies**

Run:

```bash
npm install --save-dev --save-exact ffmpeg-static@5.2.0 sharp@0.35.3
```

Add this script to `package.json`:

```json
"generate:media": "node scripts/generate-demo-media.mjs"
```

- [ ] **Step 4: Implement the generator**

Create `scripts/generate-demo-media.mjs`. It must:

1. import `ffmpeg-static`, `sharp`, `spawnSync`, and filesystem helpers;
2. create `public/media/florent`;
3. define five 1280×720, 30 fps, 6-second `nullsrc + geq` animations with
   different RGB formulas;
4. encode with:

```js
[
  "-f", "lavfi",
  "-i", source,
  "-t", "6",
  "-an",
  "-c:v", "libx264",
  "-preset", "slow",
  "-crf", "24",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  output,
]
```

Use these exact source definitions:

```js
const loops = [
  {
    id: "afterdark",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='20+25*sin((X+T*140)/70)':g='15+35*sin((Y-T*80)/90)':b='150+105*sin((X+Y+T*180)/110)'",
  },
  {
    id: "nuit-35",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='205+45*sin((X+T*95)/42)':g='170+35*sin((Y+T*45)/75)':b='145+30*sin((X-Y+T*120)/88)'",
  },
  {
    id: "orbital-radio",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='80+70*sin(hypot(X-W/2,Y-H/2)/28-T*5)':g='35+95*sin(hypot(X-W/2,Y-H/2)/38-T*4)':b='185+60*sin(hypot(X-W/2,Y-H/2)/50-T*6)'",
  },
  {
    id: "material-memory",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='155+70*sin((X+Y+T*35)/145)':g='130+75*sin((X-Y-T*55)/125)':b='90+55*sin((Y+T*65)/105)'",
  },
  {
    id: "sans-titre-08",
    source:
      "nullsrc=s=1280x720:r=30,geq=r='120+115*sin((X+T*220)/32)':g='120+115*sin((Y-T*180)/37)':b='120+115*sin((X+Y+T*260)/44)'",
  },
];
```

After each MP4, extract a poster:

```js
[
  "-ss", "1",
  "-i", videoPath,
  "-frames:v", "1",
  "-q:v", "3",
  posterPath,
]
```

Copy `material-memory-poster.jpg` to `about-poster.jpg`.

Generate `public/og.png` through Sharp from an inline 1734×909 SVG containing:

```text
FLORENT ROSSI
ART DIRECTOR
IDEAS MOVE.
IMAGES SPEAK.
```

Use an off-white `#f2efe6` background, black type, an acid yellow
`#dfff00` block, and an electric blue `#2600ff` circle. Throw immediately when
any `spawnSync` call returns a non-zero exit status.

- [ ] **Step 5: Generate assets and confirm GREEN**

Run:

```bash
npm run generate:media
npx tsx --test tests/demo-media.test.ts
```

Expected: five unique MP4 loops and six JPEG posters are created; the test PASSes.

- [ ] **Step 6: Inspect representative visual output**

Render contact-sheet thumbnails from all five posters and visually verify that
the palettes and motion identities are distinct. Check the regenerated
`public/og.png` at its native size and confirm that it says `FLORENT ROSSI`.

- [ ] **Step 7: Commit the generated media**

```bash
git add package.json package-lock.json scripts/generate-demo-media.mjs tests/demo-media.test.ts public/media/florent public/og.png
git commit -m "feat: add self-hosted motion portfolio media"
```

---

### Task 4: Synchronize the validated personal content to Supabase

**Files:**
- No repository file changes.

**Interfaces:**
- Consumes: parsed `content/default.json` from Tasks 1–3 and Supabase project `kzowrkfounzeytgtvndh`.
- Produces: identical `draft` and `published` documents containing the Florent Rossi payload.

- [ ] **Step 1: Validate the exact seed locally**

Run:

```bash
npx tsx --eval "import c from './content/default.json' with { type: 'json' }; import { parsePortfolioContent } from './content/schema.ts'; console.log(parsePortfolioContent(c).projects.length)"
```

Expected: `5`.

- [ ] **Step 2: Read the current remote document keys**

Execute read-only SQL through the Supabase connector:

```sql
select key, content -> 'site' ->> 'name' as site_name, updated_at
from public.portfolio_documents
order by key;
```

Expected before synchronization: both `draft` and `published` still report
`Atelier Vif`.

- [ ] **Step 3: Atomically update both remote documents**

Build the SQL from the validated in-memory value so the connector receives the
exact JSON without a hand-copied payload:

```ts
import content from "./content/default.json" with { type: "json" };
import { parsePortfolioContent } from "./content/schema";

const payload = JSON.stringify(parsePortfolioContent(content));
const delimiter = "$portfolio_json$";
if (payload.includes(delimiter)) {
  throw new Error("Unexpected PostgreSQL dollar-quote delimiter in content");
}

const sql = `
begin;
update public.portfolio_documents
set content = ${delimiter}${payload}${delimiter}::jsonb,
    updated_at = now()
where key in ('draft', 'published');
commit;
`;
```

Pass `sql` unchanged to the Supabase `execute_sql` connector for project
`kzowrkfounzeytgtvndh`. Do not alter keys or translations during transfer.

- [ ] **Step 4: Verify RLS-visible published content**

Execute:

```sql
select
  key,
  content -> 'site' ->> 'name' as site_name,
  jsonb_array_length(content -> 'projects') as project_count,
  content -> 'projects' -> 0 -> 'preview' ->> 'url' as first_preview
from public.portfolio_documents
order by key;
```

Expected for both rows:

```text
site_name    = Florent Rossi
project_count = 5
first_preview = /media/florent/afterdark-loop.mp4
```

- [ ] **Step 5: Re-run Supabase security advisors**

Run the Supabase security advisor for `kzowrkfounzeytgtvndh`.

Expected: zero security lints.

---

### Task 5: Verify, publish, and test the live portfolio

**Files:**
- Potentially modify only files needed to correct failures found by this task.

**Interfaces:**
- Consumes: all repository commits and synchronized Supabase content.
- Produces: a green `main` branch on GitHub and a `READY` Vercel production deployment.

- [ ] **Step 1: Run the full local verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
git diff --check
```

Expected:

- all tests PASS;
- TypeScript exits `0`;
- ESLint exits `0`;
- Next production build exits `0`;
- production audit reports zero vulnerabilities;
- Git diff check exits `0`.

- [ ] **Step 2: Start the production server and smoke-test routes**

Run:

```bash
npm start
```

Check:

```text
/                     → redirects to /en
/fr                   → 200 and contains Florent Rossi
/en                   → 200 and contains Florent Rossi
/fr/about             → 200
/fr/work/afterdark    → 200
/admin                → redirects to /admin/login
/admin/login          → 200
/media/florent/afterdark-loop.mp4 → 200 video/mp4
```

- [ ] **Step 3: Perform interaction and accessibility checks**

On desktop:

- hover and keyboard-focus each project card;
- verify each loop starts muted and resets when leaving;
- verify all five videos are visually distinct.

On a touch-sized viewport:

- verify posters appear before interaction;
- verify the play/pause control works;
- verify project navigation still works.

With `prefers-reduced-motion: reduce`:

- verify no automatic preview starts;
- verify posters remain legible.

- [ ] **Step 4: Review the final diff and commit corrections**

Run:

```bash
git status --short
git diff --check
```

If Step 1–3 exposed a failure, return to the task that owns the failing file,
add a regression test, implement the smallest correction, repeat the complete
verification, and commit that task-scoped correction as:

```bash
git commit -m "fix: finalize Florent Rossi portfolio"
```

If no correction was required, the working tree must already be clean.

- [ ] **Step 5: Push main and wait for Vercel**

```bash
git push origin main
```

Use Vercel deployment inspection until the Git-triggered production deployment
for the new commit reports `READY`.

- [ ] **Step 6: Verify the public alias**

Check:

```text
https://atelier-vif-portfolio.vercel.app/fr
https://atelier-vif-portfolio.vercel.app/en
https://atelier-vif-portfolio.vercel.app/fr/about
https://atelier-vif-portfolio.vercel.app/fr/work/afterdark
https://atelier-vif-portfolio.vercel.app/admin
https://atelier-vif-portfolio.vercel.app/media/florent/afterdark-loop.mp4
```

Expected: public pages and MP4 return `200`; `/admin` redirects to
`/admin/login`.

- [ ] **Step 7: Confirm GitHub and workspace state**

Expected:

```text
main tracks origin/main
working tree is clean
GitHub latest commit matches local HEAD
```
