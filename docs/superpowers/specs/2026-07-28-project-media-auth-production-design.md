# Project Media and Production Admin Auth Design

## Objective

Remove homepage-preview loops from project case studies, make the remaining
gallery layout predictable, and ensure every production admin magic link
returns to `https://florentrossi.com` rather than localhost.

## Media semantics

`Project.preview` is a dedicated homepage-card asset. Its MP4 and GIF fallback
must never be rendered again inside the corresponding project case study.

The case study keeps two independent media areas:

1. `Project.fullVideo` is the principal film displayed at the top of the page.
2. `Project.gallery` contains only additional images or videos that communicate
   something different from the homepage preview.

Before rendering a case-study gallery, a pure helper will remove entries whose
URL matches either the project's preview video URL or its GIF fallback URL.
This defensive filter also handles already-published Supabase content without
requiring the client to edit every existing project immediately.

Distinct gallery videos remain supported and editable through the existing
administration interface. No new content field or migration is required.

## Gallery layout

A filtered gallery containing one media item must not be reduced by the
`figure:last-child` rule. The first/only item remains the large gallery item.
The rule that offsets the final item applies only when it is not also the first
item.

The existing magazine layout remains unchanged for galleries with several
items. Media continue using their current cover treatment and responsive mobile
stack.

## Production admin authentication

The admin UI is hosted at `https://florentrossi.com/admin`; it is not a local
application.

The login request must use the canonical production callback:

`https://florentrossi.com/auth/confirm?next=/admin`

The client will derive this callback from the configured canonical site URL,
not directly from `window.location.origin`. Local development may still use a
local callback only when `NEXT_PUBLIC_SITE_URL` is explicitly set to a local
HTTP URL.

The hosted Supabase Auth project must be configured with:

- Site URL: `https://florentrossi.com`
- Exact redirect URL:
  `https://florentrossi.com/auth/confirm?next=/admin`
- Magic-link email template using `{{ .ConfirmationURL }}` so the
  `emailRedirectTo` value is preserved.

No Supabase access token or SMTP credential is stored in the repository.

## Failure handling

- An empty gallery after preview filtering is omitted cleanly.
- An invalid or expired magic link continues to redirect to
  `/admin/login?error=invalid-link`.
- Authentication continues to reveal neither whether an email is authorized
  nor any provider error detail.

## Tests and verification

Automated tests will prove:

- preview MP4 and fallback GIF entries are excluded from case-study galleries;
- a distinct gallery video still renders;
- a first-and-only gallery item keeps the large layout;
- the production callback is canonical even when the browser origin is
  localhost;
- an explicitly configured local site URL remains usable in local development;
- existing authentication callback safety tests still pass.

Production verification will include:

- full test, lint, TypeScript and Next.js build gates;
- Supabase Auth URL and magic-link template configuration;
- a fresh magic-link email whose destination is on `florentrossi.com`;
- responsive checks for a project with no remaining gallery and one with
  several distinct gallery items.

## Non-goals

- Adding a new media-role field to the content schema.
- Replacing Vimeo, YouTube or direct MP4 support.
- Reworking the project-page visual direction beyond the identified layout
  conflict.
- Moving the administration interface away from Supabase Auth.
