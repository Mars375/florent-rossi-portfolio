# Social Links and French Legal Compliance Design

## Status

Approved in conversation on 2026-07-28.

## Goal

Make Florent Rossi's LinkedIn, Instagram, and other professional profiles
clearly accessible throughout the portfolio, while adding a lightweight French
legal and privacy layer appropriate for a personal, non-commercial portfolio.
All social and legal content must remain editable through the existing
administration interface.

## Context and legal posture

Florent Rossi is currently an employee and uses this site as a personal
portfolio while seeking a permanent role. The site does not sell services,
provide e-commerce, offer public accounts, run advertising, or include a public
contact form.

The site is therefore treated as a non-professional online publication. Under
article 1-1 II of the French LCEN, a non-professional publisher may preserve
their private address and phone number by publishing only the hosting
provider's identity and address, provided the publisher has supplied their
identifying information to the host:

- [Légifrance — LCEN article 1-1](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000049568614/2024-11-15)

The implementation is a product compliance measure, not individualized legal
advice. If the portfolio later becomes a commercial or freelance business
site, its legal notice must be reviewed and expanded with the professional
publisher information required for that status.

## Approved approach

Use a lightweight compliance model:

- no global cookie banner;
- no analytics or advertising trackers;
- no third-party video iframe before an explicit visitor action;
- separate Legal Notice and Privacy pages in French and English;
- a shared utility footer on every public page;
- structured, editable content rather than hard-coded legal prose.

This avoids a consent-management platform while no non-essential tracker is
loaded automatically. The approach follows the CNIL distinction between
strictly necessary storage and trackers that require prior consent:

- [CNIL — Cookies and other trackers](https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi)
- [CNIL — Exercising data-protection rights](https://cnil.fr/fr/retrouver-les-coordonnees-dun-organisme-pour-exercer-vos-droits)

## Social links

### Default profiles

The default editable list is:

1. LinkedIn — `https://www.linkedin.com/`
2. Instagram — `https://www.instagram.com/`
3. Vimeo — `https://vimeo.com/`

These platform-level URLs are intentional temporary values. The administrator
will replace them with Florent's profile URLs when available.

### Presentation

Social networks use editorial text labels rather than generic icons.

- Home: clickable social links replace the current plain joined labels in the
  expressive footer.
- About: retain the existing clickable social links.
- Case studies: add the shared compact utility footer after project navigation.
- Legal and Privacy pages: add the same compact utility footer.
- Mobile: links stack with the other footer metadata.
- External links open in a new tab and use `rel="noreferrer"`.
- Every link remains keyboard accessible and receives the existing focus-ring
  treatment.

The header remains unchanged because its desktop grid is already dense and its
primary navigation is hidden on mobile.

## Shared utility footer

Create one reusable footer-links unit that consumes:

- locale;
- route base;
- localized site location;
- site copyright;
- social list;
- localized Legal and Privacy link labels.

It renders:

- the localized location;
- all enabled social links;
- localized links to `/{locale}/legal` and `/{locale}/privacy`;
- copyright.

The Home and About expressive footers embed this unit without losing their
large typography or e-mail call to action. Project, Legal, and Privacy pages use
the compact version.

## Public routes

Add:

- `/fr/legal`
- `/en/legal`
- `/fr/privacy`
- `/en/privacy`
- `/admin/preview/fr/legal` and `/admin/preview/en/legal`
- `/admin/preview/fr/privacy` and `/admin/preview/en/privacy`

Each route must:

- reject unsupported locales through the existing locale behavior;
- set localized metadata;
- expose canonical and FR/EN alternate URLs on `https://florentrossi.com`;
- use the current header and theme system;
- render the compact utility footer.

The protected preview variants read the draft document, display the existing
private-preview banner, and keep all footer navigation inside
`/admin/preview/{locale}` so an administrator can review unpublished legal
changes before publication.

## Editable content model

Keep `schemaVersion: 1` for compatibility. Add a `legal` field with a schema
default so an older Supabase document without this field remains readable and
the admin receives complete defaults on its next load.

The new focused module `content/legal.ts` owns:

- `legalContentSchema`;
- `defaultLegalContent`;
- the inferred `LegalContent` type.

`content/default.json` contains the same default value, and a test enforces that
the JSON copy and `defaultLegalContent` stay identical.

The shape is:

```ts
type LegalContent = {
  updatedAt: string;
  host: {
    name: string;
    address: string;
    url: string;
  };
  fr: LegalLocaleContent;
  en: LegalLocaleContent;
};

type LegalLocaleContent = {
  legalTitle: string;
  legalIntro: string;
  publisherLabel: string;
  publisherText: string;
  contactLabel: string;
  hostLabel: string;
  intellectualPropertyLabel: string;
  intellectualPropertyText: string;
  externalLinksLabel: string;
  externalLinksText: string;
  privacyTitle: string;
  privacyIntro: string;
  controllerLabel: string;
  controllerText: string;
  dataLabel: string;
  dataText: string;
  purposesLabel: string;
  purposesText: string;
  providersLabel: string;
  providersText: string;
  retentionLabel: string;
  retentionText: string;
  rightsLabel: string;
  rightsText: string;
  storageLabel: string;
  storageText: string;
  videosLabel: string;
  videosText: string;
  loadVideo: string;
  externalVideoNotice: string;
  footerLegal: string;
  footerPrivacy: string;
  updatedLabel: string;
};
```

Validation rules:

- all legal copy is trimmed and non-empty;
- `updatedAt` uses `YYYY-MM-DD`;
- the host URL uses HTTPS;
- existing social URLs continue to require HTTPS.

## Default legal notice

The initial French and English versions communicate the same facts:

- this is the personal, non-professional portfolio of Florent Rossi;
- contact is available at the editable site e-mail address;
- hosting provider: Vercel Inc.;
- host address: `440 N Barranca Avenue #4133, Covina, CA 91723, United States`;
- host website: `https://vercel.com`;
- portfolio text, images, films, identities, and other creative work remain
  protected by their respective rights;
- reproduction or reuse requires the relevant rights holder's authorization;
- Florent is not responsible for the continuing availability or content of
  external links;
- display the editable last-updated date.

The Vercel name and address are based on Vercel's current published company
information:

- [Vercel Privacy Notice](https://vercel.com/legal/privacy-notice)

## Default privacy notice

The initial policy states:

### Controller and contact

Florent Rossi is the data controller for direct contact received through the
portfolio. Requests concerning personal data use the editable site e-mail
address.

### Data and purposes

- No public account or contact form is offered.
- Visitors may voluntarily send identity, contact, and message data by e-mail.
- The purpose is to read and answer professional enquiries and retain necessary
  correspondence.
- Hosting may create security and access logs required to operate and protect
  the service.
- Supabase authentication and cookies are limited to Florent's private
  administration area.

### Providers

The policy names the functional categories and current providers:

- hosting and delivery: Vercel;
- portfolio content and private administration: Supabase;
- e-mail delivery and storage: the configured mail provider;
- external video playback after consent: Vimeo or YouTube.

### Retention

- professional e-mail correspondence: only as long as needed, and no longer
  than three years after the last active exchange unless a legal obligation or
  dispute requires longer retention;
- hosting and security logs: according to the technical provider's applicable
  retention period;
- admin authentication: until expiration or sign-out;
- theme preference: in the visitor's browser until cleared or changed.

### Rights

The policy explains access, rectification, erasure, restriction, objection, and
data portability where applicable. It provides the editable contact e-mail and
the right to lodge a complaint with the CNIL, linked to `https://www.cnil.fr/`.

### Local storage and cookies

The public portfolio does not install advertising or audience-measurement
cookies. It stores only the explicit light/dark preference in browser storage.
Strictly necessary authentication storage exists only in the private admin
area.

### External video

Vimeo and YouTube are not contacted when a case-study page first renders. The
visitor sees the project poster, provider name, explanatory notice, and a
localized button. The iframe is created only after that button is activated.
Consent lasts only for the mounted page and is not persisted.

Direct MP4 video continues to render immediately because it does not require a
third-party embed.

## Video consent component

Split responsibilities:

- `VideoEmbed` parses the provider and renders direct MP4 media.
- A client-side `ExternalVideoConsent` owns the consent state for Vimeo and
  YouTube.

Before consent, `ExternalVideoConsent` renders:

- the existing project poster;
- the localized external-video notice;
- the provider name;
- the localized `loadVideo` button.

After consent it renders the existing sandboxed, lazy iframe. Invalid video
sources keep the current localized unavailable state. The button is reachable
and operable by keyboard and exposes a descriptive accessible name.

## Administration

Add a fifth `legal` tab labeled `Légal`.

It contains:

1. last-updated date;
2. hosting provider name, address, and HTTPS URL;
3. a French fieldset with every `LegalLocaleContent` field;
4. an English fieldset with every `LegalLocaleContent` field.

The existing Site tab retains the dynamic social editor. Its default content is
updated to LinkedIn, Instagram, and Vimeo. Add/remove/edit behavior remains
unchanged.

Autosave, draft validation, preview behavior, and atomic publication keep their
existing flow.

## Styling

- Legal and Privacy pages use the current editorial serif/sans system.
- Their hero title is large but smaller than a case-study title.
- Content uses a readable single-column measure with numbered sections.
- Footer legal links use the existing underline-on-hover language.
- The light and dark semantic variables are reused without adding a third
  palette.
- No media zoom or decorative motion is introduced.

## Error handling and compatibility

- Old remote documents without `legal` parse with `defaultLegalContent`.
- Unsafe social or host URLs fail validation and cannot be published.
- Invalid external videos show the existing unavailable state without loading a
  third party.
- Missing or unavailable Supabase published content continues to fall back to
  the checked-in JSON.
- Social labels remain text, so an unknown future network requires no code
  change.

## Testing and verification

Automated tests must cover:

- old content without `legal` receives the complete defaults;
- checked-in JSON legal defaults match the TypeScript defaults;
- host and social URLs reject non-HTTPS values;
- the default social list contains LinkedIn, Instagram, and Vimeo;
- home, about, case study, Legal, and Privacy views expose clickable social and
  legal links;
- localized canonical and alternate metadata for all four new routes;
- Vimeo and YouTube do not render an iframe before activation;
- activating the consent control renders the parsed sandboxed iframe;
- direct MP4 still renders immediately;
- both themes style the legal pages and utility footer;
- keyboard focus remains visible;
- the complete content schema, admin editor, lint, TypeScript, and production
  build pass.

Manual browser verification must cover desktop and mobile in French and English,
both themes, keyboard activation of a third-party video, and the absence of
third-party video requests before consent.

## Deployment order

1. Deploy code that accepts missing `legal` content through schema defaults.
2. Verify the new routes and consent behavior on Vercel.
3. Publish the updated JSON to both Supabase `draft` and `published`.
4. Verify the public footer, social links, and legal pages against the remote
   content.

This order prevents either the public site or the admin from failing while the
stored document is upgraded.
