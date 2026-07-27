# Vercel + Supabase Portfolio Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Atelier Vif into a Vercel-hosted bilingual video portfolio with a single-admin Supabase/Resend back office, draft publishing, media uploads, and JSON import/export.

**Architecture:** Standard Next.js App Router runs on Vercel. Supabase Auth protects `/admin`, Postgres stores one draft and one published JSON document, and Supabase Storage stores portfolio media. Public routes consume the published document through a validated repository with a checked-in JSON fallback.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase Auth/Postgres/Storage, Resend custom SMTP, Zod, Node test runner through `tsx`, Vercel.

## Global Constraints

- Only `m.rossiflorent@gmail.com` may access or mutate admin data.
- Full films use Vimeo, YouTube, or direct MP4 URLs.
- Preview media accepts MP4/WebM first and GIF only as fallback.
- EN and FR must both be clickable and preserve the current route and hash.
- Draft saves must never modify the published document.
- Publication must atomically replace the published document with the validated draft.
- Public pages must fall back to `content/default.json` when Supabase is unavailable.
- No Resend sender domain is configured until the client's final domain is verified.
- Secrets live only in local ignored environment files and Vercel environment variables.

---

## File Structure

- `content/default.json`: editable, complete initial portfolio document.
- `content/schema.ts`: Zod schema and inferred portfolio types.
- `lib/content/repository.ts`: published/draft reads, draft saves, and publishing.
- `lib/content/video.ts`: safe Vimeo, YouTube, MP4, WebM, and GIF parsing.
- `lib/supabase/browser.ts`: browser Supabase client.
- `lib/supabase/server.ts`: cookie-aware server Supabase client.
- `lib/auth.ts`: exact admin-email authorization.
- `app/components/LanguageSwitcher.tsx`: route- and hash-preserving locale links.
- `app/components/ProjectCard.tsx`: poster, MP4/WebM/GIF preview behavior.
- `app/components/VideoEmbed.tsx`: safe full-video rendering.
- `app/admin/**`: login, protected layout, editor, preview, and server actions.
- `app/auth/callback/route.ts`: Supabase PKCE callback.
- `supabase/migrations/202607270001_portfolio_admin.sql`: table, policies, bucket, and publish function.
- `tests/**`: schema, language, auth, video, repository, and admin action tests.

---

### Task 1: Migrate the Runtime from Vinext/Sites to Standard Next.js

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `.env.example`
- Delete: `.openai/hosting.json`
- Delete: `vite.config.ts`
- Delete: `worker/index.ts`
- Delete: `build/sites-vite-plugin.ts`
- Delete: `app/chatgpt-auth.ts`
- Delete: `db/index.ts`
- Delete: `db/schema.ts`
- Delete: `drizzle.config.ts`
- Delete: `drizzle/meta/_journal.json`
- Delete: `examples/d1/app/api/notes/route.ts`
- Delete: `examples/d1/db/schema.ts`
- Test: `tests/runtime-config.test.ts`

**Interfaces:**
- Produces: standard `next dev`, `next build`, and `next start` scripts.
- Produces: public env keys `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, plus server-only `ADMIN_EMAIL`.

- [ ] **Step 1: Write the failing runtime configuration test**

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses the Vercel-compatible Next runtime", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(pkg.scripts.dev, "next dev");
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.scripts.start, "next start");
  assert.ok(pkg.dependencies["@supabase/ssr"]);
  assert.ok(pkg.dependencies["@supabase/supabase-js"]);
  assert.ok(pkg.dependencies.zod);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/runtime-config.test.ts`

Expected: FAIL because the current scripts use `vinext`.

- [ ] **Step 3: Replace the Cloudflare runtime and install only required packages**

Set scripts to:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "tsx --test tests/**/*.test.ts"
}
```

Install `@supabase/ssr`, `@supabase/supabase-js`, `zod`, and dev dependency
`tsx`. Remove Vinext, Vite, Wrangler, Cloudflare, D1 Drizzle dependencies and
the listed Cloudflare-only files. Create:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=m.rossiflorent@gmail.com
```

- [ ] **Step 4: Verify GREEN and compile**

Run: `npm test -- tests/runtime-config.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: standard Next.js production build succeeds using local JSON fallback.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example tests/runtime-config.test.ts
git add -u
git commit -m "build: migrate portfolio to Vercel Next runtime"
```

---

### Task 2: Centralize and Validate the Complete JSON Content Model

**Files:**
- Create: `content/default.json`
- Create: `content/schema.ts`
- Create: `lib/content/fallback.ts`
- Delete: `app/data/portfolio.mjs`
- Test: `tests/content-schema.test.ts`

**Interfaces:**
- Produces: `PortfolioContent`, `Project`, `LocalizedText`.
- Produces: `parsePortfolioContent(value: unknown): PortfolioContent`.
- Produces: `defaultContent: PortfolioContent`.

- [ ] **Step 1: Write failing schema tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import content from "../content/default.json";
import { parsePortfolioContent } from "../content/schema";

test("accepts the complete bilingual default portfolio", () => {
  const parsed = parsePortfolioContent(content);
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.projects.length, 5);
  assert.ok(parsed.projects.every((project) => project.title.en && project.title.fr));
});

test("rejects duplicate slugs and missing translations", () => {
  const invalid = structuredClone(content);
  invalid.projects[1].slug = invalid.projects[0].slug;
  invalid.projects[0].title.fr = "";
  assert.throws(() => parsePortfolioContent(invalid), /slug|translation/i);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx tsx --test tests/content-schema.test.ts`

Expected: FAIL because `content/schema.ts` does not exist.

- [ ] **Step 3: Implement the model and convert all current copy**

Define localized values with:

```ts
const localizedText = z.object({
  en: z.string().trim().min(1),
  fr: z.string().trim().min(1),
});
```

Define project media as:

```ts
preview: z.object({
  type: z.enum(["video", "gif", "poster"]),
  url: z.string().url().or(z.literal("")),
  fallbackGifUrl: z.string().url().or(z.literal("")),
}),
fullVideo: z.object({
  provider: z.enum(["vimeo", "youtube", "mp4"]),
  url: z.string().url(),
}),
```

Use a `superRefine` check to reject duplicate project `id`, `slug`, and
`order`. Move every homepage, Studio, footer, project story, gallery caption,
credit, label, link, and media URL from the components into `default.json`.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx --test tests/content-schema.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add content app/data/portfolio.mjs lib/content/fallback.ts tests/content-schema.test.ts
git commit -m "feat: centralize portfolio content in validated JSON"
```

---

### Task 3: Add Supabase Schema, Storage, and Atomic Publishing

**Files:**
- Create: `supabase/migrations/202607270001_portfolio_admin.sql`
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/auth.ts`
- Create: `lib/content/repository.ts`
- Test: `tests/auth.test.ts`
- Test: `tests/repository.test.ts`

**Interfaces:**
- Produces: `isAdminEmail(email: string | null): boolean`.
- Produces: `getPublishedContent(): Promise<PortfolioContent>`.
- Produces: `getDraftContent(): Promise<PortfolioContent>`.
- Produces: `saveDraft(content: unknown): Promise<PortfolioContent>`.
- Produces: `publishDraft(): Promise<void>`.

- [ ] **Step 1: Write failing authorization and repository tests**

```ts
test("authorizes only the configured administrator", () => {
  assert.equal(isAdminEmail("m.rossiflorent@gmail.com"), true);
  assert.equal(isAdminEmail("M.ROSSIFLORENT@gmail.com"), true);
  assert.equal(isAdminEmail("other@example.com"), false);
  assert.equal(isAdminEmail(null), false);
});

test("falls back to checked-in JSON when published content is unavailable", async () => {
  const repository = createContentRepository({
    read: async () => { throw new Error("offline"); },
    writeDraft: async () => undefined,
    publish: async () => undefined,
  });
  assert.equal((await repository.getPublished()).site.name, "Atelier Vif");
});

test("validates before saving a draft", async () => {
  const repository = createContentRepository(fakeStore);
  await assert.rejects(() => repository.saveDraft({ schemaVersion: 1 }), /required/i);
  assert.equal(fakeStore.writeCalls, 0);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/auth.test.ts tests/repository.test.ts`

Expected: FAIL because auth and repository modules do not exist.

- [ ] **Step 3: Implement the SQL migration**

Create `portfolio_documents(key text primary key, content jsonb not null,
updated_at timestamptz not null default now(), updated_by uuid)`. Enable RLS.
Allow anonymous `SELECT` only when `key = 'published'`. Allow authenticated
read/write only when `lower(auth.jwt()->>'email') =
'm.rossiflorent@gmail.com'`.

Create `publish_portfolio()` as a transaction-safe Postgres function that:

```sql
if lower(coalesce(auth.jwt()->>'email', '')) <> 'm.rossiflorent@gmail.com' then
  raise exception 'forbidden' using errcode = '42501';
end if;

insert into public.portfolio_documents (key, content, updated_by)
select 'published', content, auth.uid()
from public.portfolio_documents
where key = 'draft'
on conflict (key) do update
set content = excluded.content,
    updated_at = now(),
    updated_by = excluded.updated_by;
```

Create public bucket `portfolio-media` with accepted MIME types
`image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm` and a
25 MiB file limit. Permit public reads and admin-only writes/deletes through
storage RLS policies.

- [ ] **Step 4: Implement clients and repository**

Use `@supabase/ssr` for cookie-aware server clients and
`@supabase/supabase-js` for the browser client. Parse every database read with
`parsePortfolioContent`. Make public reads return `defaultContent` on missing
environment, empty row, network error, or invalid remote content. Never apply
fallback behavior to admin writes.

- [ ] **Step 5: Verify GREEN**

Run: `npx tsx --test tests/auth.test.ts tests/repository.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase lib tests/auth.test.ts tests/repository.test.ts
git commit -m "feat: add secure Supabase content repository"
```

---

### Task 4: Refactor Public Routes for JSON Content, Video, and Language Switching

**Files:**
- Create: `app/components/LanguageSwitcher.tsx`
- Create: `app/components/VideoEmbed.tsx`
- Modify: `app/components/SiteHeader.tsx`
- Modify: `app/components/ProjectCard.tsx`
- Modify: `app/[locale]/page.tsx`
- Modify: `app/[locale]/about/page.tsx`
- Modify: `app/[locale]/work/[slug]/page.tsx`
- Modify: `app/globals.css`
- Create: `lib/content/locales.ts`
- Create: `lib/content/video.ts`
- Test: `tests/locales.test.ts`
- Test: `tests/video.test.ts`

**Interfaces:**
- Produces: `localizedPath(pathname, locale): string`.
- Produces: `parseVideoSource(url, provider): VideoSource`.
- Consumes: `getPublishedContent()`.

- [ ] **Step 1: Write failing locale and video tests**

```ts
test("switches both locale directions while preserving route and hash", () => {
  assert.equal(localizedPath("/en/work/afterdark#film", "fr"), "/fr/work/afterdark#film");
  assert.equal(localizedPath("/fr/about", "en"), "/en/about");
});

test("parses supported video providers without accepting arbitrary embeds", () => {
  assert.deepEqual(
    parseVideoSource("https://vimeo.com/123456", "vimeo"),
    { kind: "embed", src: "https://player.vimeo.com/video/123456" },
  );
  assert.deepEqual(
    parseVideoSource("https://youtu.be/abcDEF12345", "youtube"),
    { kind: "embed", src: "https://www.youtube-nocookie.com/embed/abcDEF12345" },
  );
  assert.throws(() => parseVideoSource("javascript:alert(1)", "mp4"));
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/locales.test.ts tests/video.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement locale links and safe media parsing**

`LanguageSwitcher` uses `usePathname()` and includes
`window.location.hash` during click enhancement. Render both locale values as
links, set `aria-current="page"` only on the active value, and preserve a
normal server-rendered `href` for no-JavaScript navigation.

`parseVideoSource` accepts numeric Vimeo IDs, eleven-character YouTube IDs,
and HTTPS `.mp4` URLs only. `VideoEmbed` uses a sandboxed iframe for embeds and
`<video controls playsInline>` for MP4.

- [ ] **Step 4: Refactor public pages and preview cards**

Fetch one published document per route. Sort visible projects by `order`.
Render preview media in this order:

1. MP4/WebM `<video muted loop playsInline preload="metadata">`;
2. GIF fallback;
3. poster image.

Desktop hover/focus starts and stops the preview. Mobile exposes a dedicated
play/pause button. Reduced-motion users receive the poster without autoplay.
Move all remaining business copy into `default.json`.

- [ ] **Step 5: Verify GREEN and build**

Run: `npm test -- tests/locales.test.ts tests/video.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: `/en`, `/fr`, `/[locale]/about`, and project routes compile.

- [ ] **Step 6: Commit**

```bash
git add app content lib tests/locales.test.ts tests/video.test.ts
git commit -m "feat: render bilingual video portfolio from JSON"
```

---

### Task 5: Implement Magic-Link Authentication and Protected Admin Shell

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/LoginForm.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `proxy.ts`
- Test: `tests/auth-flow.test.ts`

**Interfaces:**
- Produces: `safeNextPath(value: string | null): string`.
- Produces: `/auth/callback` PKCE code exchange.
- Consumes: `isAdminEmail`.

- [ ] **Step 1: Write failing auth-flow tests**

```ts
test("keeps auth redirects on the same origin", () => {
  assert.equal(safeNextPath("/admin?tab=projects"), "/admin?tab=projects");
  assert.equal(safeNextPath("https://evil.example/"), "/admin");
  assert.equal(safeNextPath("//evil.example/"), "/admin");
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `npx tsx --test tests/auth-flow.test.ts`

Expected: FAIL because `safeNextPath` does not exist.

- [ ] **Step 3: Implement login, callback, and server authorization**

The login form calls:

```ts
await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${origin}/auth/callback?next=/admin` },
});
```

Always display a neutral success message to avoid exposing whether an address
is authorized. The callback exchanges `code` for a session and redirects only
through `safeNextPath`. The protected layout reads the authenticated user on
the server and redirects missing sessions to `/admin/login`; non-admin sessions
receive a 403 page and a sign-out action.

- [ ] **Step 4: Refresh sessions in `proxy.ts`**

Refresh Supabase auth cookies for `/admin/:path*` and `/auth/:path*`. Do not
protect the public locale routes.

- [ ] **Step 5: Verify GREEN and build**

Run: `npm test -- tests/auth-flow.test.ts tests/auth.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: admin and callback routes compile as dynamic routes.

- [ ] **Step 6: Commit**

```bash
git add app/admin app/auth proxy.ts tests/auth-flow.test.ts
git commit -m "feat: protect portfolio admin with magic-link auth"
```

---

### Task 6: Build the Draft Editor, Preview, Import/Export, and Publishing

**Files:**
- Create: `app/admin/actions.ts`
- Create: `app/admin/AdminEditor.tsx`
- Create: `app/admin/components/LocalizedField.tsx`
- Create: `app/admin/components/ProjectEditor.tsx`
- Create: `app/admin/components/PublishBar.tsx`
- Create: `app/admin/preview/[locale]/page.tsx`
- Create: `lib/content/editor.ts`
- Modify: `app/globals.css`
- Test: `tests/editor.test.ts`
- Test: `tests/admin-actions.test.ts`

**Interfaces:**
- Produces: `reorderProjects(projects, orderedIds): Project[]`.
- Produces: `publishDraftWithRepository(input, repository): Promise<ActionResult>`.
- Produces server actions `saveDraftAction`, `publishDraftAction`.
- Consumes repository draft/publish methods.

- [ ] **Step 1: Write failing editor and action tests**

```ts
test("reorders projects without changing their content", () => {
  const reordered = reorderProjects(defaultContent.projects, ["nuit-35", "afterdark"]);
  assert.equal(reordered[0].id, "nuit-35");
  assert.equal(reordered[0].order, 1);
  assert.equal(reordered[1].id, "afterdark");
  assert.equal(reordered[1].order, 2);
});

test("publishing validates the draft before invoking storage", async () => {
  const result = await publishDraftWithRepository(invalidDraft, fakeRepository);
  assert.equal(result.ok, false);
  assert.equal(fakeRepository.publishCalls, 0);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/editor.test.ts tests/admin-actions.test.ts`

Expected: FAIL because editor utilities and actions do not exist.

- [ ] **Step 3: Implement admin editing**

Create tabs for Site, Home, Studio, and Projects. Provide paired EN/FR fields.
Project controls support add, duplicate, delete with confirmation, move up/down,
and edit of all media, story, gallery, and credit fields. Debounce autosave by
800 ms and show `Unsaved`, `Saving`, `Saved`, or `Error` state.

- [ ] **Step 4: Implement import/export and draft preview**

Export the current draft as `atelier-vif-content.json`. Import reads a selected
file, parses JSON, validates with `parsePortfolioContent`, and replaces only
the local editor state until autosave succeeds. `/admin/preview/en` and
`/admin/preview/fr` render the draft through the same public presentation
components without exposing the draft to anonymous visitors.

- [ ] **Step 5: Implement explicit publishing**

Require a confirmation dialog. The action revalidates the document, calls the
atomic database function, then revalidates `/en`, `/fr`, Studio, and all
published project paths.

- [ ] **Step 6: Verify GREEN and build**

Run: `npm test -- tests/editor.test.ts tests/admin-actions.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: editor and protected preview compile.

- [ ] **Step 7: Commit**

```bash
git add app/admin lib/content/editor.ts app/globals.css tests/editor.test.ts tests/admin-actions.test.ts
git commit -m "feat: add draft portfolio editor and publishing"
```

---

### Task 7: Add Direct Supabase Media Uploads

**Files:**
- Create: `app/admin/components/MediaUploader.tsx`
- Create: `lib/content/media.ts`
- Modify: `app/admin/components/ProjectEditor.tsx`
- Test: `tests/media.test.ts`

**Interfaces:**
- Produces: `validateMediaFile(file): { kind, extension }`.
- Produces: `mediaObjectPath(projectId, file): string`.

- [ ] **Step 1: Write failing media validation tests**

```ts
test("accepts optimized portfolio media and rejects oversized files", () => {
  const file = (name: string, type: string, size: number) => ({ name, type, size });
  assert.deepEqual(
    validateMediaFile(file("loop.mp4", "video/mp4", 5_000_000)),
    { kind: "preview", extension: "mp4" },
  );
  assert.throws(
    () => validateMediaFile(file("huge.mp4", "video/mp4", 26 * 1024 * 1024)),
    /25 MB/i,
  );
  assert.throws(() => validateMediaFile(file("script.svg", "image/svg+xml", 1000)));
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `npx tsx --test tests/media.test.ts`

Expected: FAIL because media validation does not exist.

- [ ] **Step 3: Implement direct authenticated uploads**

Validate MIME type and size in the browser. Upload directly with the
authenticated Supabase browser client to:

```text
projects/{projectId}/{timestamp}-{sanitizedFilename}
```

Use `upsert: false`, display a deterministic uploading state, and write the
public object URL into the draft only after upload succeeds. Keep the previous
URL on failure. Deleting an object requires explicit confirmation and admin
storage RLS.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/media.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: uploader compiles without routing file bytes through Vercel.

- [ ] **Step 5: Commit**

```bash
git add app/admin/components/MediaUploader.tsx app/admin/components/ProjectEditor.tsx lib/content/media.ts tests/media.test.ts
git commit -m "feat: add secure portfolio media uploads"
```

---

### Task 8: Apply and Audit the Supabase Development Project

**Files:**
- Modify only if generated types differ: `lib/supabase/database.types.ts`

**Interfaces:**
- Target project: Supabase `atelier-vif` in `eu-west-3`.
- Consumes migration from Task 3 and `content/default.json`.

- [ ] **Step 1: Install and read the official Supabase agent skill**

Run: `npx skills add supabase/agent-skills`

Read its security and migration instructions before remote changes.

- [ ] **Step 2: Inspect the empty remote project**

Use Supabase MCP `list_tables`, `get_logs`, and `get_advisors` before applying
changes. Expected: no conflicting `portfolio_documents` table or
`portfolio-media` bucket.

- [ ] **Step 3: Apply the migration once**

Use Supabase MCP `apply_migration` with the exact checked-in SQL and migration
name `portfolio_admin`. Do not execute ad hoc schema statements outside the
migration.

- [ ] **Step 4: Seed draft and published documents**

Validate `content/default.json`, serialize it, and upsert the exact same JSON
into keys `draft` and `published`. Confirm both rows parse back through
`parsePortfolioContent`.

- [ ] **Step 5: Retrieve client configuration and generate types**

Use `get_project_url`, `get_publishable_api_key`, and
`generate_typescript_types`. Store public values in ignored `.env.local`;
never commit them. Save generated types only if the application imports them.

- [ ] **Step 6: Run security and performance advisors**

Use `get_advisors` after migration. Fix every relevant RLS/security finding in
a new checked-in migration, apply it, and rerun advisors until no relevant
finding remains.

- [ ] **Step 7: Commit generated source changes**

```bash
git add supabase lib/supabase/database.types.ts
git commit -m "chore: align Supabase development schema"
```

Skip the type file from the commit when it was not generated or changed.

---

### Task 9: Configure Resend Handoff and Validate the Vercel Build

**Files:**
- Modify: `README.md`
- Create: `docs/client-editor-guide.md`
- Test: entire suite

**Interfaces:**
- Documents final-domain prerequisites without storing secrets.
- Produces a Vercel-ready repository and client editing guide.

- [ ] **Step 1: Document the final-domain Resend configuration**

Document these exact launch steps:

1. Add the final portfolio domain in Resend.
2. Add the returned SPF and DKIM DNS records.
3. Wait until Resend reports the domain as verified.
4. Create a sending-only Resend key scoped to that domain.
5. Configure Supabase Auth custom SMTP with host `smtp.resend.com`, port `465`,
   username `resend`, and the Resend key as password.
6. Add the production Vercel callback URL to Supabase Auth redirect URLs.

- [ ] **Step 2: Write the client editor guide**

Explain login, bilingual editing, preview uploads, Vimeo/YouTube links,
autosave, preview, publishing, project ordering, JSON export, and JSON restore
in nontechnical French.

- [ ] **Step 3: Run the complete verification**

Run:

```bash
npm test
npm run build
npm run lint
git diff --check
git status --short
```

Expected: all tests pass, build and lint succeed, no whitespace errors, and
only intentional documentation/source changes are present.

- [ ] **Step 4: Verify hosted service state**

Use Supabase MCP to check Auth, Postgres, and Storage logs for recent errors.
Do not create a Resend domain or API key until the final domain is known.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/client-editor-guide.md
git commit -m "docs: add Vercel and client editor handoff"
```

- [ ] **Step 6: Prepare deployment handoff**

Push the branch to the user's Git repository. Connect that repository to
Vercel, add the four environment variables from `.env.example`, and deploy.
If Vercel access is unavailable in the session, return the verified repository
as the blocker-free handoff and request only the Vercel project connection.
