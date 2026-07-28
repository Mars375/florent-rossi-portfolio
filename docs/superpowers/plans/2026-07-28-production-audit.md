# Production Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a reproducible, evidence-backed production audit of `florentrossi.com`, prioritized from P0 to P3, and immediately remediate every confirmed defect on the isolated branch without intentionally changing the public design, editorial content or URL contract.

**Architecture:** Public behavior, administration and security, performance, accessibility and SEO, then architecture and operations are inspected independently. Within each task, every confirmed defect goes through root-cause analysis, a failing regression test, the smallest safe fix and independent review before the next task starts. The report records both the original evidence and the verified final state; deployment remains deferred until the integrated branch passes final review.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Supabase, Vercel, Node.js 22, Node test runner through `tsx`, ESLint 9, Lighthouse CLI, Codex Browser.

## Global Constraints

- The public design and editorial content remain unchanged unless correcting a confirmed defect.
- Existing public routes and URLs remain compatible.
- Validated JSON and Supabase remain the single source of portfolio content.
- No partial or invalid document may replace published content.
- Every corrected bug must receive a regression test.
- Keep an optimization only when it creates a measurable gain or a clear structural simplification.
- Every correction lot must remain independently deployable and verifiable.
- Confirmed defects are fixed in the isolated worktree during Tasks 2–6; do not defer a safe in-scope fix merely because the audit is still running.
- Before implementation, establish the cause and add a regression test that demonstrably fails for the confirmed defect.
- Keep fixes minimal and commit them with their tests and updated audit evidence.
- A second agent must review each completed task for specification compliance and code quality before the next task starts.
- Do not mutate live Supabase data, Vercel configuration, portfolio content or the deployed production branch during the audit-remediation.
- Do not deploy or merge until the complete integrated branch passes final review and all verification gates.

---

## File Structure

- Create `docs/audits/2026-07-28-production-audit.md` as the single audit ledger and final report.
- Modify that report throughout Tasks 1–7. Tasks 2–6 may also modify the
  smallest necessary source, test and documentation files for confirmed defects.
- Use `C:\tmp\florent-rossi-audit\` for Lighthouse JSON, the temporary
  `summarize-lighthouse.mjs` helper, response headers and other transient
  evidence. Never commit this directory.
- Read production code, tests, migrations and configuration without modifying them.

The report owns evidence, severity, cause, remediation and verification status.
Temporary files own raw machine output. The task commits own regression tests and
minimal implementation changes.

## Continuous Remediation Protocol

For every `FAIL` or source-level defect confirmed during Tasks 2–6:

1. reproduce it and record the evidence in the report;
2. establish the smallest verified root cause;
3. add a focused regression test and run it to observe the expected failure;
4. implement the smallest safe correction without unrelated refactoring;
5. run the focused test, the relevant task gates and `git diff --check`;
6. update the finding with the fix commit and final verification state;
7. submit the complete task diff to an independent reviewer.

Observations without reproducible impact stay documented as observations and are
not changed speculatively. Remote data/configuration changes require separate
explicit authorization; code-side remediations do not.

---

### Task 1: Establish the Reproducible Baseline

**Files:**
- Create: `docs/audits/2026-07-28-production-audit.md`
- Read: `package.json`
- Read: `package-lock.json`
- Read: `next.config.ts`
- Read: `README.md`
- Read: `docs/client-editor-guide.md`

**Interfaces:**
- Consumes: isolated branch base, deployed commit, package scripts and the validated specification at `docs/superpowers/specs/2026-07-28-production-audit-refactor-design.md`.
- Produces: a report header, environment inventory and baseline verification table used by every later task.

- [ ] **Step 1: Confirm the audit starts from the intended isolated worktree**

Run:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
node --version
```

Expected:

- `git status --short` prints nothing.
- The branch is `audit/production-remediation`.
- `HEAD` contains the approved audit planning commits; `origin/main` is recorded
  separately as the deployed-source reference.
- Node is `v22.13.0` or newer.

If the tree contains changes outside the approved plan amendment, stop and report
the exact state before continuing.

- [ ] **Step 2: Create the audit report with fixed scope and evidence rules**

Create the report with this exact initial structure:

```markdown
# Audit de production — Florent Rossi

Date : 28 juillet 2026
Production : https://florentrossi.com

## Référence

## Méthode

L’audit-remédiation conserve une preuve reproductible pour chaque constat :
sévérité P0 à P3, impact, cause racine, correction appliquée et validation.
Les données Supabase, le contenu public, la configuration Vercel et la branche
déployée ne sont pas modifiés pendant le travail isolé.

## Baseline de vérification

## Constats

## Backlog de correction

## Limites de l’audit
```

Use `apply_patch`; do not use shell redirection to create the file. Under
`## Référence`, add four literal bullet lines containing the exact commit and
Node.js values observed in Step 1, the branch `audit/production-remediation`,
the `origin/main` deployed-source reference, and the Supabase region `eu-west-3`.
Do not leave command names or instructional prose in the report.

- [ ] **Step 3: Run the complete automated baseline**

Run each command separately:

```powershell
$portfolioTests = Get-ChildItem -Path tests -File |
  Where-Object { $_.Name -match '\.test\.tsx?$' } |
  ForEach-Object { $_.FullName }
node node_modules/tsx/dist/cli.mjs --test $portfolioTests
```

```powershell
node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next
```

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

```powershell
node node_modules/next/dist/bin/next build
```

Expected:

- all tests pass with zero failures;
- ESLint exits `0`;
- TypeScript exits `0`;
- Next.js reports `Compiled successfully`.

Record the exact test count, duration and exit status for all four gates under
`## Baseline de vérification`. A failure is a finding and follows the Continuous
Remediation Protocol before Task 1 is accepted.

- [ ] **Step 4: Record the production deployment baseline**

Use the GitHub commit-status connector for `origin/main`, the deployed
production-source reference. `HEAD` is the isolated audit branch and is
intentionally not deployed before final integrated review.

Expected:

- the `Vercel` context is `success`;
- the deployed commit equals the recorded `origin/main` reference;
- the local audit `HEAD` is recorded separately and may differ from
  `origin/main` while deployment is deferred.

Add the deployment status and Vercel target URL to the baseline table.

- [ ] **Step 5: Commit the baseline**

```powershell
git add docs/audits/2026-07-28-production-audit.md
git commit -m "docs: record production audit baseline"
```

---

### Task 2: Audit the Public Functional Contract

**Files:**
- Modify: `docs/audits/2026-07-28-production-audit.md`
- Read: `content/default.json`
- Read: `app/[locale]/page.tsx`
- Read: `app/[locale]/about/page.tsx`
- Read: `app/[locale]/work/[slug]/page.tsx`
- Read: `app/components/LanguageSwitcher.tsx`
- Read: `app/components/ThemeToggle.tsx`
- Read: `app/components/ProjectCard.tsx`
- Read: `app/components/ProjectView.tsx`

**Interfaces:**
- Consumes: the baseline report and the live production deployment.
- Produces: a public route matrix and confirmed functional findings with reproducible browser evidence.

- [ ] **Step 1: Build the expected route matrix from validated content**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs -e "import content from './content/default.json' with { type: 'json' }; console.log(content.projects.map((project) => project.slug).join('\\n'))"
```

Record these expected pages:

- `/fr` and `/en`;
- `/fr/about` and `/en/about`;
- `/fr/legal`, `/en/legal`, `/fr/privacy`, `/en/privacy`;
- every `/fr/work/<slug>` and `/en/work/<slug>`;
- one invalid route `/fr/work/audit-slug-inexistant`.

- [ ] **Step 2: Verify desktop navigation and visible states**

Use Codex Browser with a `1440 × 900` viewport. For each route:

- verify HTTP navigation completes without an error page;
- verify `html[lang]` matches the locale;
- verify the header, main landmark and footer are present;
- verify every internal link stays on `florentrossi.com`;
- verify the invalid project returns the intended not-found state.

On `/fr`:

- switch to English by clicking `EN`, then back to French by clicking `FR`;
- toggle dark mode twice and verify the explicit theme changes;
- hover one project card and verify the preview becomes active;
- move the pointer away and verify playback stops;
- focus the same card with the keyboard and verify an equivalent preview state;
- open the project and verify the route uses its stable slug.

Record each check as `PASS`, `FAIL` or `NOT TESTABLE` in a route matrix. For every `FAIL`, add a finding using the report format from the specification.

- [ ] **Step 3: Verify mobile and reduced-motion behavior**

Use Codex Browser with a `390 × 844` viewport:

- verify `/fr`, `/fr/about` and one case study have no horizontal overflow;
- verify project cards remain navigable by touch-sized controls;
- verify project previews remain poster-first;
- verify language and theme controls remain reachable.

Then emulate `prefers-reduced-motion: reduce` through the browser capability or supported Playwright media setting. If the browser surface cannot emulate it, mark the live check `NOT TESTABLE` and use `tests/project-card.test.tsx` plus CSS inspection as evidence. Verify no hover video is created under reduced motion.

- [ ] **Step 4: Inspect console errors**

For `/fr`, `/en`, `/fr/about` and one case study, read browser console logs at level `error`.

Expected: zero uncaught runtime errors.

Network failures from blocked third-party video embeds must be distinguished from application exceptions and recorded separately.

- [ ] **Step 5: Append public functional evidence and commit**

Add:

- the route matrix;
- desktop interaction results;
- mobile and reduced-motion results;
- console-error results;
- any P0–P3 findings.

Commit:

```powershell
git add docs/audits/2026-07-28-production-audit.md
git commit -m "docs: audit public portfolio behavior"
```

---

### Task 3: Audit Administration, Authentication and Data Safety

**Files:**
- Modify: `docs/audits/2026-07-28-production-audit.md`
- Read: `app/admin/AdminEditor.tsx`
- Read: `app/admin/actions.ts`
- Read: `app/admin/auth-actions.ts`
- Read: `app/admin/login/actions.ts`
- Read: `app/auth/confirm/route.ts`
- Read: `lib/auth.ts`
- Read: `lib/content/editor.ts`
- Read: `lib/content/repository.ts`
- Read: `proxy.ts`
- Read: `supabase/migrations/*.sql`
- Read: `tests/admin-actions.test.ts`
- Read: `tests/auth-flow.test.ts`
- Read: `tests/migration-security.test.ts`

**Interfaces:**
- Consumes: current source, automated auth/repository tests, Supabase read-only logs and advisors.
- Produces: findings about authorization, atomic publication, validation, session handling and data-loss risk. No draft or published document is mutated.

- [ ] **Step 1: Verify unauthenticated route boundaries**

Run:

```powershell
curl.exe -sS -D C:\tmp\florent-rossi-admin.headers.txt -o NUL https://florentrossi.com/admin
curl.exe -sS -D C:\tmp\florent-rossi-preview.headers.txt -o NUL https://florentrossi.com/admin/preview/fr
curl.exe -sS -D C:\tmp\florent-rossi-login.headers.txt -o NUL https://florentrossi.com/admin/login
```

Expected:

- `/admin` and `/admin/preview/fr` redirect unauthenticated requests to `/admin/login`;
- `/admin/login` is reachable;
- redirect targets remain on `florentrossi.com`.

Record status and `Location` headers. Do not request a magic link and do not
submit an email because live authentication actions are outside the authorized
remote-mutation scope.

- [ ] **Step 2: Trace the authorization and publication path**

Document this exact flow from source:

```text
request → proxy session refresh → protected layout → isAdminEmail
draft edit → saveDraftAction → requireAdmin → repository.saveDraft
publish → publishDraftAction → requireAdmin → parsePortfolioContent
→ atomic Supabase publish function → revalidation → unused media cleanup
```

For each boundary, record:

- authenticated identity source;
- allow-list source;
- validation call;
- database function or table touched;
- failure behavior;
- whether published data can change before full validation succeeds.

Any missing authorization or non-atomic write is at least P1.

- [ ] **Step 3: Verify open-redirect and expired-session defenses**

Run the existing targeted tests:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/auth-flow.test.ts tests/admin-login.test.ts tests/admin-route.test.ts tests/auth.test.ts
```

Expected: all pass.

Inspect `app/auth/confirm/route.ts` and confirm:

- `next` accepts only local admin destinations;
- invalid or expired tokens return a controlled login error;
- localhost redirects are allowed only in development;
- production site URLs come from validated configuration.

- [ ] **Step 4: Review Supabase security evidence**

Use Supabase read-only tools:

1. call `list_tables` for project `kzowrkfounzeytgtvndh` and confirm the
   document table and storage metadata expected by migrations;
2. call `get_advisors` for both `security` and `performance`;
3. call `get_logs` for `auth`, `postgres` and `storage`, limiting each result to
   recent errors relevant to the portfolio flows;
4. compare active policies/functions with every migration in order.

Expected:

- no RLS-disabled content table;
- no public write access to portfolio documents;
- `is_portfolio_admin()` matches the intended administrator allow-list;
- publication is exposed only through the restricted atomic function;
- storage writes require an authorized administrator.

Do not apply migrations or change configuration during this task.

- [ ] **Step 5: Check repository secret hygiene**

Run:

```powershell
git ls-files .env .env.local "*.pem" "*.key"
rg -n --hidden -g '!node_modules/**' -g '!.git/**' -g '!.next/**' "(service_role|RESEND_API_KEY|sk_live_|SUPABASE_SERVICE_ROLE|X-Goog-Api-Key|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY)"
```

Expected:

- no secret file is tracked;
- no live secret is present in tracked source or documentation.

Public Supabase URL and publishable keys are not secret findings.

- [ ] **Step 6: Append administration and security evidence and commit**

Add:

- route-boundary results;
- the authorization/data-flow trace;
- test results;
- Supabase advisor/log summaries;
- secret-hygiene results;
- all confirmed findings.

Commit:

```powershell
git add docs/audits/2026-07-28-production-audit.md
git commit -m "docs: audit admin and data security"
```

---

### Task 4: Measure Performance and Media Delivery

**Files:**
- Modify: `docs/audits/2026-07-28-production-audit.md`
- Read: `public/media/florent/*`
- Read: `app/components/ProjectCard.tsx`
- Read: `app/components/VideoEmbed.tsx`
- Read: `next.config.ts`
- Temporary: `C:\tmp\florent-rossi-audit\*.json`

**Interfaces:**
- Consumes: live `/fr` and `/fr/work/afterdark`, production media URLs and the current build.
- Produces: repeatable lab metrics, media budgets, cache-header evidence and performance findings.

- [ ] **Step 1: Create an isolated temporary evidence directory**

Run:

```powershell
$auditTemp = 'C:\tmp\florent-rossi-audit'
if (Test-Path -LiteralPath $auditTemp) {
  $resolvedAuditTemp = (Resolve-Path -LiteralPath $auditTemp).Path
  if ($resolvedAuditTemp -ne 'C:\tmp\florent-rossi-audit') {
    throw "Unexpected audit path: $resolvedAuditTemp"
  }
} else {
  New-Item -ItemType Directory -Path $auditTemp | Out-Null
}
```

- [ ] **Step 2: Inventory committed media against documented budgets**

Run:

```powershell
Get-ChildItem public/media/florent -File |
  Sort-Object Name |
  Select-Object Name, Length
```

Compare each file with the client guide:

- poster: under `500 KB`;
- GIF preview: under or equal to `2 MB`;
- MP4/WebM loop: under `4 MB`;
- upload hard limit: `25 MB`.

Record total media bytes, largest file per type and every budget violation.

- [ ] **Step 3: Capture production media headers**

For one poster, GIF and MP4:

```powershell
curl.exe -sS -I https://florentrossi.com/media/florent/afterdark-poster.jpg
curl.exe -sS -I https://florentrossi.com/media/florent/afterdark-preview.gif
curl.exe -sS -I https://florentrossi.com/media/florent/afterdark-loop.mp4
```

Record:

- status;
- `Content-Type`;
- `Content-Length`;
- `Cache-Control`;
- `ETag` or `Last-Modified`;
- `Accept-Ranges` for video.

Missing immutable caching or byte-range support is a performance finding.

- [ ] **Step 4: Run repeatable Lighthouse baselines**

Confirm Chrome exists:

```powershell
Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

Expected: `True`.

Use temporary Lighthouse execution without changing `package.json`. Run three times for each URL and strategy:

```powershell
$npmCli = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$urls = @{
  home = 'https://florentrossi.com/fr'
  project = 'https://florentrossi.com/fr/work/afterdark'
}
$strategies = @('mobile', 'desktop')
foreach ($name in $urls.Keys) {
  foreach ($strategy in $strategies) {
    1..3 | ForEach-Object {
      node $npmCli exec --yes --package=lighthouse -- lighthouse $urls[$name] `
        --chrome-path="$chrome" `
        --chrome-flags="--headless --disable-gpu" `
        --form-factor=$strategy `
        --only-categories=performance,accessibility,best-practices,seo `
        --output=json `
        --output-path="C:\tmp\florent-rossi-audit\$name-$strategy-$_.json" `
        --quiet
      if ($LASTEXITCODE -ne 0) { throw "Lighthouse failed for $name $strategy run $_" }
    }
  }
}
```

Record the resolved Lighthouse version from the JSON `lighthouseVersion` field.

- [ ] **Step 5: Calculate median lab metrics**

Create `C:\tmp\florent-rossi-audit\summarize-lighthouse.mjs` with
`apply_patch` and this exact content:

```javascript
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const directory = "C:\\tmp\\florent-rossi-audit";
const filenames = (await readdir(directory)).filter((name) =>
  /^(home|project)-(mobile|desktop)-[1-3]\.json$/.test(name),
);

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
}

const reports = await Promise.all(
  filenames.map(async (filename) => ({
    filename,
    report: JSON.parse(await readFile(join(directory, filename), "utf8")),
  })),
);

const groups = new Map();
for (const item of reports) {
  const match = item.filename.match(
    /^(home|project)-(mobile|desktop)-[1-3]\.json$/,
  );
  if (!match) continue;
  const key = `${match[1]}-${match[2]}`;
  const existing = groups.get(key) ?? [];
  existing.push(item.report);
  groups.set(key, existing);
}

for (const [key, values] of [...groups].sort(([left], [right]) =>
  left.localeCompare(right),
)) {
  if (values.length !== 3) {
    throw new Error(`${key} has ${values.length} reports instead of 3`);
  }

  const metric = (selector) => median(values.map(selector));
  console.log(
    JSON.stringify({
      key,
      lighthouseVersion: values[0].lighthouseVersion,
      performance: metric(
        (report) => report.categories.performance.score * 100,
      ),
      accessibility: metric(
        (report) => report.categories.accessibility.score * 100,
      ),
      bestPractices: metric(
        (report) => report.categories["best-practices"].score * 100,
      ),
      seo: metric((report) => report.categories.seo.score * 100),
      fcpMs: metric(
        (report) => report.audits["first-contentful-paint"].numericValue,
      ),
      lcpMs: metric(
        (report) => report.audits["largest-contentful-paint"].numericValue,
      ),
      tbtMs: metric(
        (report) => report.audits["total-blocking-time"].numericValue,
      ),
      cls: metric(
        (report) => report.audits["cumulative-layout-shift"].numericValue,
      ),
      speedIndexMs: metric(
        (report) => report.audits["speed-index"].numericValue,
      ),
      transferredBytes: metric(
        (report) => report.audits["total-byte-weight"].numericValue,
      ),
    }),
  );
}
```

Run:

```powershell
node C:\tmp\florent-rossi-audit\summarize-lighthouse.mjs
```

Expected: four JSON lines named `home-mobile`, `home-desktop`,
`project-mobile` and `project-desktop`.

For every URL and strategy, record the reported median of:

- performance score;
- accessibility score;
- best-practices score;
- SEO score;
- First Contentful Paint;
- Largest Contentful Paint;
- Total Blocking Time;
- Cumulative Layout Shift;
- Speed Index;
- transferred bytes.

Use a bounded Node command that reads only `C:\tmp\florent-rossi-audit\*.json`. Record literal median values in the report. Do not commit raw Lighthouse JSON.

Classify:

- LCP above `2.5 s` as at least P2;
- TBT above `200 ms` as at least P2;
- CLS above `0.1` as at least P2;
- a performance score below `90` as requiring a documented recommendation.

- [ ] **Step 6: Verify preview loading behavior against network expectations**

With Browser on `/fr`:

- before interaction, verify the project card has only its poster in the DOM;
- hover once and verify one preview asset is created;
- leave and hover again and verify the same media element is reused;
- on a mobile viewport, verify the preview asset is not created automatically;
- with reduced motion, verify the preview asset is not created.

Cross-reference `tests/project-card.test.tsx`. Any production behavior contradicting the tested contract is P1 or P2 depending on user impact.

- [ ] **Step 7: Append performance evidence and commit**

Add metrics, media inventory, cache evidence, loading behavior and findings.

Commit:

```powershell
git add docs/audits/2026-07-28-production-audit.md
git commit -m "docs: record performance audit"
```

---

### Task 5: Audit Accessibility and SEO

**Files:**
- Modify: `docs/audits/2026-07-28-production-audit.md`
- Read: `app/layout.tsx`
- Read: `app/[locale]/*/page.tsx`
- Read: `app/components/SiteHeader.tsx`
- Read: `app/components/LanguageSwitcher.tsx`
- Read: `app/components/ThemeToggle.tsx`
- Read: `app/components/ExternalVideoConsent.tsx`
- Read: `app/components/VideoEmbed.tsx`
- Read: `app/globals.css`
- Read: `public/favicon.svg`
- Read: `public/og.png`
- Temporary: Lighthouse JSON created in Task 4.

**Interfaces:**
- Consumes: the functional route matrix and Lighthouse results.
- Produces: keyboard, semantics, contrast, metadata and indexation findings.

- [ ] **Step 1: Verify document metadata for both locales**

For `/fr`, `/en`, both about pages and one project in each locale, inspect:

- unique non-empty `<title>`;
- meta description;
- canonical URL;
- FR/EN alternate links;
- Open Graph title, description, image and URL;
- Twitter card metadata;
- `html[lang]`;
- one logical `<h1>`.

Record exact missing or duplicated signals. Do not infer a pass from source alone; verify production DOM.

- [ ] **Step 2: Verify robots and sitemap endpoints**

Run:

```powershell
curl.exe -sS -D C:\tmp\florent-rossi-robots.headers.txt https://florentrossi.com/robots.txt
curl.exe -sS -D C:\tmp\florent-rossi-sitemap.headers.txt https://florentrossi.com/sitemap.xml
```

Expected:

- both return `200`;
- robots permits public localized pages and does not expose admin previews for indexing;
- sitemap uses `https://florentrossi.com`;
- sitemap includes FR/EN home, about, legal, privacy and published project routes.

Missing endpoints or incorrect indexation rules are SEO findings.

- [ ] **Step 3: Perform a keyboard-only path**

At desktop width, without pointer clicks:

1. traverse header controls;
2. switch locale;
3. toggle theme;
4. enter the project grid;
5. open a project;
6. reach the external video consent control;
7. return to work;
8. reach footer social and legal links.

Verify:

- focus is always visible;
- order follows visual reading order;
- no focus trap exists;
- every interactive element has a meaningful accessible name;
- preview activation by focus does not prevent navigation.

Record the first failing step and exact control for every defect.

- [ ] **Step 4: Verify contrast and motion contracts**

Use Lighthouse accessibility results and the existing CSS contrast tests. Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/theme.test.tsx tests/project-card.test.tsx tests/video-consent.test.tsx
```

Expected: all pass.

In production, verify:

- light and dark text remain readable;
- visible focus meets contrast expectations;
- reduced motion removes non-essential preview animation;
- the consent-gated Vimeo/YouTube control remains understandable without video.

- [ ] **Step 5: Append accessibility and SEO evidence and commit**

Add metadata matrix, robots/sitemap results, keyboard path, contrast/motion results and findings.

Commit:

```powershell
git add docs/audits/2026-07-28-production-audit.md
git commit -m "docs: audit accessibility and SEO"
```

---

### Task 6: Audit Architecture, Dependencies and Operational Drift

**Files:**
- Modify: `docs/audits/2026-07-28-production-audit.md`
- Read: `app/**/*.ts`
- Read: `app/**/*.tsx`
- Read: `lib/**/*.ts`
- Read: `content/**/*.ts`
- Read: `tests/**/*.ts`
- Read: `tests/**/*.tsx`
- Read: `README.md`
- Read: `docs/client-editor-guide.md`
- Read: `package.json`
- Read: `package-lock.json`

**Interfaces:**
- Consumes: all earlier findings and the current source tree.
- Produces: maintainability, dependency and documentation-drift findings plus precise refactoring boundaries for future plans.

- [ ] **Step 1: Inventory client boundaries and file sizes**

Run:

```powershell
rg -l '^"use client";' app lib
```

```powershell
Get-ChildItem app,lib,content -Recurse -File -Include *.ts,*.tsx |
  ForEach-Object {
    [PSCustomObject]@{
      Lines = (Get-Content -LiteralPath $_.FullName).Count
      Path = $_.FullName.Replace((Get-Location).Path + '\','')
    }
  } |
  Sort-Object Lines -Descending |
  Select-Object -First 30
```

Record:

- client components that could be server-rendered;
- files above `300` lines;
- files mixing state orchestration, data transformation and rendering;
- duplicated localized-form patterns.

A large file is not automatically a defect; require a concrete cohesion, testing or change-risk impact before creating a finding.

- [ ] **Step 2: Map component boundaries and remediate confirmed cohesion defects**

For `AdminEditor.tsx` and `ProjectEditor.tsx`, document:

- current responsibilities;
- state owned;
- server actions called;
- child components;
- independent sections that can expose typed `value` and `onChange` interfaces;
- behavior that must remain stable during a future split.

The boundary proposal must name exact units, such as:

```text
AdminEditor
├── SiteSettingsEditor
├── HomeContentEditor
├── AboutContentEditor
├── ProjectWorkspace
└── LegalEditor

ProjectEditor
├── ProjectIdentityFields
├── ProjectMediaFields
├── ProjectStoryFields
├── ProjectGalleryFields
└── ProjectCreditsFields
```

If the inventory confirms concrete cohesion, testing or change-risk impact,
apply the smallest behavior-preserving split through the Continuous Remediation
Protocol. Do not refactor solely because a file exceeds a line threshold.

- [ ] **Step 3: Audit production and development dependencies**

Run:

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' audit --omit=dev --json
```

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' audit --json
```

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' outdated --json
```

Record:

- production vulnerability count by severity;
- development-only vulnerability count by severity;
- direct dependencies with newer major versions;
- whether an upgrade is required for a confirmed issue.

Do not run `npm audit fix`, install packages or update the lockfile during the audit.

- [ ] **Step 4: Check documentation against the live editor and configuration**

Compare `README.md` and `docs/client-editor-guide.md` with source and current production behavior.

Verify at minimum:

- documented administrator addresses match the implemented allow-list model;
- the number and names of editor tabs match `AdminEditor`;
- preview behavior describes MP4/WebM, GIF and posters accurately;
- domain, Supabase region and redirect URLs are current;
- Resend instructions no longer claim the final domain is unknown;
- all documented commands work on Windows in this repository.

Each material mismatch is a P2 or P3 operational finding.

- [ ] **Step 5: Check error and validation ownership**

Trace:

- schema validation messages;
- `portfolioErrorMessage`;
- autosave error handling;
- import error handling;
- publish error handling;
- media cleanup failure handling.

Record duplicated or inconsistent formatting, and identify the smallest future module boundary that can centralize the behavior without coupling UI to Supabase.

- [ ] **Step 6: Append architecture and operations evidence and commit**

Add file-size inventory, boundary proposal, dependency results, documentation drift and findings.

Commit:

```powershell
git add docs/audits/2026-07-28-production-audit.md
git commit -m "docs: audit architecture and operations"
```

---

### Task 7: Synthesize Findings and Produce the Correction Backlog

**Files:**
- Modify: `docs/audits/2026-07-28-production-audit.md`
- Read: `docs/superpowers/specs/2026-07-28-production-audit-refactor-design.md`

**Interfaces:**
- Consumes: every evidence section and finding from Tasks 1–6.
- Produces: the final prioritized report and four independently plannable correction backlogs.

- [ ] **Step 1: Normalize every finding**

For each finding, enforce this exact structure:

```markdown
### [P0|P1|P2|P3] — Concise defect title

- **Preuve :** exact command, route, source location or browser sequence.
- **Impact :** concrete user, business, security or maintenance consequence.
- **Cause racine :** smallest verified technical cause.
- **Correction proposée :** bounded change, without unrelated refactoring.
- **Validation :** exact regression test, command or before/after metric.
- **Lot :** Fiabilité et sécurité | Performance et expérience | Accessibilité et SEO | Structure et maintenabilité.
```

Remove observations that have no impact or no reproducible evidence. Merge duplicate findings that share one cause.

- [ ] **Step 2: Sort and summarize severity**

Sort findings in this order:

1. P0;
2. P1;
3. P2;
4. P3.

At the top of `## Constats`, add a table with counts by severity and lot. If a severity has zero findings, record `0`; do not omit it.

- [ ] **Step 3: Build four correction backlogs**

Under `## Backlog de correction`, add:

1. `Lot 1 — Fiabilité et sécurité`;
2. `Lot 2 — Performance et expérience`;
3. `Lot 3 — Accessibilité et SEO`;
4. `Lot 4 — Structure et maintenabilité`.

Within each lot:

- list finding titles in dependency order;
- identify blockers;
- state the user-visible success criterion;
- name the likely files and tests;
- estimate risk as `faible`, `moyen` or `élevé`.

Summarize both remediated findings and any residual items that could not be
safely addressed within the authorized scope.

- [ ] **Step 4: Document audit limitations**

Record only limitations that actually occurred, such as:

- an authenticated live admin action intentionally not executed because remote
  mutations are outside the authorized scope;
- a browser capability that could not emulate reduced motion;
- a rate-limited Lighthouse or Supabase endpoint;
- absence of real-user Core Web Vitals.

Do not use limitations to hide missing checks that can still be completed safely.

- [ ] **Step 5: Self-review the final report**

Run:

```powershell
rg -n "T[B]D|T[O]DO|F[I]XME|à vérifier|à compléter|contenu provisoire" docs/audits/2026-07-28-production-audit.md
git diff --check
```

Expected:

- the incomplete-content scan prints nothing;
- `git diff --check` exits `0`.

Then manually verify:

- every specification axis has evidence;
- every finding has severity, proof, impact, cause, correction, validation and lot;
- counts equal the actual findings;
- every code change maps to a confirmed finding and verified remediation;
- no live production, Supabase-data or Vercel-configuration mutation is included.

- [ ] **Step 6: Remove transient audit evidence**

Run:

```powershell
$auditDirectory = 'C:\tmp\florent-rossi-audit'
if (Test-Path -LiteralPath $auditDirectory) {
  $resolvedAuditDirectory = (Resolve-Path -LiteralPath $auditDirectory).Path
  if ($resolvedAuditDirectory -ne 'C:\tmp\florent-rossi-audit') {
    throw "Unexpected audit directory: $resolvedAuditDirectory"
  }
  Remove-Item -LiteralPath $resolvedAuditDirectory -Recurse
}

$auditFiles = @(
  'C:\tmp\florent-rossi-admin.headers.txt',
  'C:\tmp\florent-rossi-preview.headers.txt',
  'C:\tmp\florent-rossi-login.headers.txt',
  'C:\tmp\florent-rossi-robots.headers.txt',
  'C:\tmp\florent-rossi-sitemap.headers.txt'
)
foreach ($auditFile in $auditFiles) {
  if ((Split-Path -Parent $auditFile) -ne 'C:\tmp') {
    throw "Unexpected audit file: $auditFile"
  }
  if (Test-Path -LiteralPath $auditFile) {
    Remove-Item -LiteralPath $auditFile
  }
}
```

Expected: all named temporary evidence is removed and the repository tree is unaffected.

- [ ] **Step 7: Commit the final audit**

```powershell
git add docs/audits/2026-07-28-production-audit.md
git commit -m "docs: finalize production audit"
```

- [ ] **Step 8: Present the audit for review**

Report:

- the audit document path;
- counts of P0, P1, P2 and P3;
- the three highest-priority findings;
- which correction lot should be planned first;
- any audit limitation.

Present the fully reviewed audit-remediation branch for integration. Any residual
finding requiring remote authority or a materially broader redesign receives a
separate follow-up plan.
