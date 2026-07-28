# Temporary Secondary Admin Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Authorize `rossi.loic1@gmail.com` alongside Florent Rossi as a temporary production administrator without removing the existing access.

**Architecture:** Keep `isAdminEmail` as the single authorization boundary, but make it consume a normalized list from `ADMIN_EMAILS`. Preserve `ADMIN_EMAIL` and the Florent Rossi default as fallbacks, then configure the two-address list in Vercel and let the production magic-link flow create or reuse the Supabase user.

**Tech Stack:** TypeScript, Node test runner, Next.js 16, Vercel environment variables, Supabase Auth.

## Global Constraints

- Keep `m.rossiflorent@gmail.com` authorized while adding `rossi.loic1@gmail.com`.
- `ADMIN_EMAILS` is a comma-separated server-only variable.
- Preserve backward compatibility with `ADMIN_EMAIL`.
- Normalize whitespace and casing, deduplicate addresses, and ignore empty entries.
- When neither variable supplies an address, authorize only `m.rossiflorent@gmail.com`.
- Removing temporary access later must require only a Vercel variable update and redeployment.
- Do not expose admin email configuration through any `NEXT_PUBLIC_*` variable.

---

### Task 1: Support multiple configured administrators

**Files:**
- Modify: `lib/auth.ts`
- Modify: `tests/auth.test.ts`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Produces: `configuredAdminEmails(): string[]`
- Preserves: `isAdminEmail(email: string | null | undefined): boolean`
- Consumes: `process.env.ADMIN_EMAILS`, `process.env.ADMIN_EMAIL`

- [ ] **Step 1: Write failing configuration tests**

Replace the existing single test in `tests/auth.test.ts` with isolated
environment tests. Preserve and restore both environment variables around each
case.

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { configuredAdminEmails, isAdminEmail } from "../lib/auth";

function withAdminEnv(
  values: { ADMIN_EMAILS?: string; ADMIN_EMAIL?: string },
  assertion: () => void,
) {
  const previousEmails = process.env.ADMIN_EMAILS;
  const previousEmail = process.env.ADMIN_EMAIL;

  try {
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAIL;
    if (values.ADMIN_EMAILS !== undefined) {
      process.env.ADMIN_EMAILS = values.ADMIN_EMAILS;
    }
    if (values.ADMIN_EMAIL !== undefined) {
      process.env.ADMIN_EMAIL = values.ADMIN_EMAIL;
    }
    assertion();
  } finally {
    if (previousEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previousEmails;
    if (previousEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previousEmail;
  }
}

test("authorizes every normalized ADMIN_EMAILS entry", () => {
  withAdminEnv(
    {
      ADMIN_EMAILS:
        " m.rossiflorent@gmail.com, ROSSI.LOIC1@GMAIL.COM, ,rossi.loic1@gmail.com ",
    },
    () => {
      assert.deepEqual(configuredAdminEmails(), [
        "m.rossiflorent@gmail.com",
        "rossi.loic1@gmail.com",
      ]);
      assert.equal(isAdminEmail("rossi.loic1@gmail.com"), true);
      assert.equal(isAdminEmail(" M.ROSSIFLORENT@GMAIL.COM "), true);
      assert.equal(isAdminEmail("other@example.com"), false);
      assert.equal(isAdminEmail(null), false);
    },
  );
});

test("falls back through ADMIN_EMAIL and then the Florent default", () => {
  withAdminEnv(
    { ADMIN_EMAILS: " , ", ADMIN_EMAIL: " Legacy@Example.com " },
    () => {
      assert.deepEqual(configuredAdminEmails(), ["legacy@example.com"]);
      assert.equal(isAdminEmail("LEGACY@example.com"), true);
    },
  );

  withAdminEnv({}, () => {
    assert.deepEqual(configuredAdminEmails(), [
      "m.rossiflorent@gmail.com",
    ]);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/auth.test.ts
```

Expected: FAIL because `configuredAdminEmails` is not exported and the
single-address implementation cannot authorize the second address.

- [ ] **Step 3: Implement normalized list configuration**

Replace the single-address helper in `lib/auth.ts` with:

```ts
const DEFAULT_ADMIN_EMAIL = "m.rossiflorent@gmail.com";

function normalizeEmailList(value: string | undefined): string[] {
  if (!value) return [];

  return [
    ...new Set(
      value
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function configuredAdminEmails(): string[] {
  const configured = normalizeEmailList(process.env.ADMIN_EMAILS);
  if (configured.length > 0) return configured;

  const legacy = normalizeEmailList(process.env.ADMIN_EMAIL);
  return legacy.length > 0 ? legacy : [DEFAULT_ADMIN_EMAIL];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}
```

Leave `safeNextPath` unchanged.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/auth.test.ts tests/auth-flow.test.ts
```

Expected: all auth tests PASS.

- [ ] **Step 5: Document the new variable**

In `.env.example`, replace:

```dotenv
ADMIN_EMAIL=m.rossiflorent@gmail.com
```

with:

```dotenv
ADMIN_EMAILS=m.rossiflorent@gmail.com
```

In `README.md`, make the same replacement in the environment example, change
the description from one administrator to configured administrators, and
document that `ADMIN_EMAIL` remains a legacy fallback.

- [ ] **Step 6: Run repository verification**

Run:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/auth.test.ts tests/auth-flow.test.ts
node node_modules/eslint/bin/eslint.js lib/auth.ts tests/auth.test.ts
node node_modules/typescript/bin/tsc --noEmit
git diff --check
```

Expected: every command exits `0`.

- [ ] **Step 7: Commit**

```powershell
git add lib/auth.ts tests/auth.test.ts .env.example README.md
git commit -m "feat: support multiple portfolio administrators"
```

---

### Task 2: Configure, deploy, and validate temporary access

**Files:**
- No repository files.

**Interfaces:**
- Consumes: `ADMIN_EMAILS` from Task 1.
- Produces: a deployed production environment authorizing both addresses.

- [ ] **Step 1: Configure Vercel**

Set the server-only variable in both Production and Preview:

```dotenv
ADMIN_EMAILS=m.rossiflorent@gmail.com,rossi.loic1@gmail.com
```

Do not create a `NEXT_PUBLIC_ADMIN_EMAILS` variable. Leave any existing
`ADMIN_EMAIL` in place during rollout because `ADMIN_EMAILS` takes precedence.

- [ ] **Step 2: Run the full pre-deployment gates**

Run:

```powershell
$portfolioTests = Get-ChildItem -Path tests -File |
  Where-Object { $_.Name -match '\.test\.tsx?$' } |
  ForEach-Object { $_.FullName }
node node_modules/tsx/dist/cli.mjs --test $portfolioTests
node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
git diff --check
```

Expected: all tests pass, lint and type checking exit `0`, the production build
completes, and the working tree contains no generated-media change.

- [ ] **Step 3: Push and wait for Vercel**

Push `main`, then wait for the Vercel status on the exact commit to become
`success`.

- [ ] **Step 4: Add or reuse the Supabase user**

Check Supabase Authentication Users for `rossi.loic1@gmail.com`. If absent,
request a magic link from `https://florentrossi.com/admin/login`; the configured
`shouldCreateUser: true` flow creates the user without an administrator
password. Do not create a duplicate.

- [ ] **Step 5: Validate the production flow**

Request a fresh magic link for `rossi.loic1@gmail.com` and verify that the
application reports successful sending. The recipient clicks the newest link
and must land on:

```text
https://florentrossi.com/admin
```

Confirm that `m.rossiflorent@gmail.com` remains listed in Supabase and remains
authorized by the production configuration.
