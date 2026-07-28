# Temporary secondary admin email

## Goal

Authorize `rossi.loic1@gmail.com` as a temporary second portfolio administrator
without removing access for `m.rossiflorent@gmail.com`.

## Configuration model

The application will accept a comma-separated `ADMIN_EMAILS` environment
variable. `ADMIN_EMAIL` remains supported for backward compatibility. When
neither variable is configured, the existing Florent Rossi address remains the
only default administrator.

Configured addresses are trimmed, normalized to lowercase, deduplicated, and
empty entries are ignored. Authorization continues to deny missing or unknown
addresses.

Production will use:

```dotenv
ADMIN_EMAILS=m.rossiflorent@gmail.com,rossi.loic1@gmail.com
```

Removing temporary access later requires deleting the second address from the
Vercel variable and redeploying. No source-code rollback is needed.

## Supabase

`rossi.loic1@gmail.com` will be added to Supabase Authentication only if it does
not already exist. The existing user for `m.rossiflorent@gmail.com` remains
unchanged. A fresh magic link will be requested from the production admin login
after deployment.

## Code and documentation

- Replace the single-email configuration helper with a list-based helper while
  preserving `isAdminEmail` as the authorization interface used by protected
  routes and server actions.
- Document `ADMIN_EMAILS` in `.env.example` and `README.md`.
- Do not expose either environment variable to client-side bundles.

## Tests and validation

Tests will prove:

- both configured addresses are authorized;
- whitespace, casing, duplicates, and empty entries are normalized safely;
- `ADMIN_EMAIL` still works when `ADMIN_EMAILS` is absent;
- the default remains Florent Rossi when neither variable exists;
- unknown and missing addresses are rejected.

The change will be validated with targeted auth tests, the full test suite,
ESLint, TypeScript, a production build, and a production magic-link request for
`rossi.loic1@gmail.com`.
